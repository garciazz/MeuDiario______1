// Erro "esperado" da aplicação: carrega o status HTTP e uma mensagem segura para o cliente.
class AppError extends Error {
  constructor(status, mensagem, detalhes, codigo) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
    this.codigo = codigo; // identificador estável para o app (ex.: CONSENTIMENTO_NECESSARIO)
  }
}

module.exports = AppError;
