import { expect, type Page, test } from '@playwright/test';

const geocodingResponse = {
  results: [
    {
      name: 'São Paulo',
      admin1: 'São Paulo',
      country: 'Brasil',
      latitude: -23.5,
      longitude: -46.6,
    },
  ],
};

const forecastResponse = {
  timezone: 'America/Sao_Paulo',
  utc_offset_seconds: -10_800,
  current: {
    time: '2026-11-06T10:00',
    temperature_2m: 0,
    apparent_temperature: 0,
    relative_humidity_2m: 72,
    wind_speed_10m: 12.6,
    precipitation: 0,
    weather_code: 0,
  },
  daily: {
    time: ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'],
    weather_code: [0, 1, 2, 3, 61],
    temperature_2m_min: [0, 1, 2, 3, 4],
    temperature_2m_max: [10, 11, 12, 13, 14],
  },
};

async function mockOpenMeteo(page: Page, geocodingBody: unknown = geocodingResponse) {
  await page.route('**/geocoding-api.open-meteo.com/v1/search**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(geocodingBody),
    }),
  );
  await page.route('**/api.open-meteo.com/v1/forecast**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecastResponse),
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-06T13:00:00Z'));
});

test('busca uma cidade, mostra a previsão e converte a temperatura para Fahrenheit', async ({
  page,
}) => {
  await mockOpenMeteo(page);

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.getByText(/Temperatura:\s*32 °F/)).toBeVisible();
  await expect(page.getByText('32 °F', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '°F' })).toBeFocused();
});

test('mostra estado sem resultados quando a busca não encontra a cidade', async ({ page }) => {
  await mockOpenMeteo(page, {});
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
});

test('permite resolver cidades ambíguas antes de carregar a previsão', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/v1/search**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            name: 'Pinhais',
            admin1: 'Paraná',
            country: 'Brasil',
            latitude: -25.44,
            longitude: -49.19,
          },
          {
            name: 'Pinhais',
            admin1: 'Santa Catarina',
            country: 'Brasil',
            latitude: -26.1,
            longitude: -49.2,
          },
        ],
      }),
    }),
  );
  let forecastRequests = 0;
  await page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
    forecastRequests += 1;
    await route.fulfill({ json: forecastResponse });
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Pinhais');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Selecione uma cidade' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pinhais, Paraná, Brasil' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pinhais, Santa Catarina, Brasil' })).toBeVisible();
  expect(forecastRequests).toBe(0);

  await page.getByRole('button', { name: 'Pinhais, Paraná, Brasil' }).click();

  await expect(page.getByRole('heading', { name: 'Pinhais' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  expect(forecastRequests).toBe(1);
});

test('renderiza clima e previsão no viewport mobile de 375 × 812', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockOpenMeteo(page);
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByText(/Temperatura:\s*0 °C/)).toBeVisible();
  await expect(page.getByText('0 °C', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
});

test('sinaliza loading e permite recuperar uma falha por retry', async ({ page }) => {
  await mockOpenMeteo(page);
  let attempts = 0;
  let releaseResponse!: () => void;
  const pending = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await pending;
      await route.fulfill({ status: 503 });
    } else {
      await route.fulfill({ json: forecastResponse });
    }
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('searchbox', { name: 'Cidade' }).press('Enter');
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('status')).toContainText('Carregando');
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeDisabled();
  releaseResponse();

  await expect(page.getByRole('alert')).toContainText('Não foi possível consultar');
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
  expect(attempts).toBe(2);
});

test('mantém cache da cidade e bloqueia retry durante limite do provedor', async ({ page }) => {
  await mockOpenMeteo(page);
  let attempts = 0;
  await page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ json: forecastResponse });
    } else {
      await route.fulfill({
        status: 429,
        headers: { 'Retry-After': '1', 'Access-Control-Expose-Headers': 'Retry-After' },
      });
    }
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('muitas consultas');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeDisabled();
  await expect(page.getByText(/Dados desatualizados/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  expect(attempts).toBe(2);
  await page.clock.setFixedTime(new Date('2026-11-06T13:00:02Z'));
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled({
    timeout: 5000,
  });
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`não apresenta rolagem horizontal na busca e previsão em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockOpenMeteo(page);
    await page.goto('/');
    await expect(page.getByRole('searchbox', { name: 'Cidade' })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('searchbox', { name: 'Cidade' }).press('Enter');
    await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(5);
    await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
}
