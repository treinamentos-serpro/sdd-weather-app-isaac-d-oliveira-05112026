# Operação do piloto Open-Meteo

O piloto é supervisionado, não público e não comercial. A equipe responsável
mantém uma contagem operacional compartilhada, sem nomes de cidades, unidades
ou identificadores pessoais. Analytics de uso não será ativado.

Antes do início, registrar responsáveis, período, total inicial e procedimento
de acompanhamento. Uma pessoa coordenadora deve autorizar sessões e reservar
no contador compartilhado capacidade suficiente para todas as chamadas de cada
ação antes de iniciá-la: por exemplo, até duas para busca seguida de previsão.
Não iniciar uma ação cuja reserva faria o total de chamadas iniciadas mais
reservas ultrapassar 1.000; liberar a reserva não utilizada ao concluir a ação.
Isso exige coordenação de todas as sessões, inclusive chamadas em andamento.
Para cada request iniciado, converter uma reserva em chamada contabilizada:
geocoding, previsão, atualização e cada tentativa, inclusive as que falharem
ou forem canceladas. Conferir os registros durante as 30 sessões supervisionadas.

Ao atingir 1.000 chamadas, pausar a admissão de novas sessões e interromper
imediatamente novas chamadas em todas as sessões em andamento. Retomar somente
após revisão e autorização do orçamento. Esse procedimento é operacional:
o navegador não implementa uma cota global e não garante o bloqueio agregado.

Pendência para Produto/Privacidade: avaliar e aprovar como informar que a cidade
digitada é enviada ao Open-Meteo para geocodificação. Não registrar consultas
ou unidades em logs ou telemetria. A revisão formal de privacidade, segurança e
termos continua necessária antes de publicação.
