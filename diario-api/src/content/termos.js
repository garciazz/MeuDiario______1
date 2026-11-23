// Texto do Aviso de consentimento, do Termo de Autorização e da Política de Privacidade.
// Mudou o texto? Aumente VERSAO: todos os usuários verão o aviso de novo e precisarão aceitar outra vez.
const { termos: t } = require('../config/env');

const VERSAO = '1.0';

const p = (texto) => ({ tipo: 'p', texto });
const lista = (itens) => ({ tipo: 'lista', itens });
const sub = (texto) => ({ tipo: 'subtitulo', texto });

const TEXTO_ACEITE = `Li e autorizo a ${t.empresa} a armazenar e usar os meus dados pessoais sensíveis para as finalidades acima.`;

const aviso = {
  titulo: 'Antes de começar, precisamos da sua autorização',
  blocos: [
    p(
      'O Meu Diário guarda o que você escreve sobre como se sente. Isso pode incluir informações sensíveis sobre a sua saúde e o seu bem-estar emocional, como ansiedade, pânico ou burnout.'
    ),
    p('Usamos essas informações somente para:'),
    lista([
      'guardar o seu diário e mostrar o seu histórico;',
      'gerar relatórios sobre as suas emoções;',
      'enviar os lembretes que você configurar;',
      'manter a sua conta e o seu acesso seguros.',
    ]),
    p(
      `Seus dados ficam em servidor próprio da ${t.empresa} e não são divulgados a terceiros. Você pode retirar a sua autorização e apagar a sua conta quando quiser.`
    ),
  ],
};

const termo = {
  titulo: 'Termo de Autorização de Uso de Dados Pessoais Sensíveis',
  blocos: [
    p(
      'Ao marcar “Li e autorizo”, você consente de forma livre, informada e específica com o tratamento dos seus dados pessoais sensíveis pelo Meu Diário, conforme este Termo e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, a LGPD).'
    ),
    sub('2.1 Quem é o responsável pelos seus dados'),
    p(
      `O controlador é a ${t.empresa}, com sede em ${t.cidade.replace('/', ' - ')}, ${t.pais}. O encarregado pela proteção de dados atende pelo e-mail ${t.encarregadoEmail}.`
    ),
    sub('2.2 O que são dados sensíveis e por que pedimos a sua autorização'),
    p(
      'Dados sensíveis são informações que exigem proteção reforçada, como as relacionadas à saúde. No diário, o que você escreve sobre suas emoções e os temas que escolhe, como ansiedade, pânico ou burnout, pode revelar informações sobre a sua saúde física ou mental. Por isso pedimos a sua autorização expressa antes do primeiro registro.'
    ),
    sub('2.3 Quais dados sensíveis podem ser armazenados'),
    lista([
      'a emoção que você escolhe em cada entrada;',
      'os textos das suas respostas: o que te fez bem, o que te fez mal e o que você aprendeu;',
      'as áreas de interesse marcadas no cadastro, como ansiedade, pânico e burnout;',
      'as fotos que você decidir anexar a uma entrada;',
      'os títulos e as descrições de lembretes e tags, quando revelarem informações sobre a sua saúde.',
    ]),
    sub('2.4 Para que usamos esses dados'),
    p('Usamos os seus dados sensíveis somente para:'),
    lista([
      'guardar as suas entradas e permitir que você as consulte, edite e apague;',
      'gerar relatórios para você acompanhar os seus padrões emocionais;',
      'enviar os lembretes que você mesmo configurar;',
      'guardar as áreas de interesse que você escolheu, para adaptar o aplicativo a esses temas;',
      'manter a sua conta e o seu acesso seguros.',
    ]),
    p(
      'Não usamos esses dados para publicidade, para venda ou para qualquer outra finalidade. Se quisermos usá-los de outra forma, pediremos uma nova autorização.'
    ),
    sub('2.5 Onde ficam os dados e com quem são compartilhados'),
    p(
      `Os dados são armazenados e processados em servidor próprio da ${t.empresa}. Não são divulgados a terceiros. A única exceção é uma ordem judicial ou uma obrigação legal: nesse caso, compartilhamos apenas o que for exigido e, quando a lei permitir, avisamos você.`
    ),
    sub('2.6 A sua autorização é voluntária e pode ser retirada'),
    p(
      'Você não é obrigado a autorizar, mas sem a autorização não é possível registrar dados no diário. Você pode retirar a autorização a qualquer momento, sem custo, excluindo a sua conta no aplicativo ou escrevendo para o encarregado. Depois disso, apagamos os seus dados, salvo os que a lei nos obrigue a guardar. A retirada não invalida o uso feito antes dela.'
    ),
    sub('2.7 Os seus direitos'),
    p(
      'Você pode pedir acesso, correção, cópia e eliminação dos seus dados, entre outros direitos previstos na LGPD. Eles estão explicados na Política de Privacidade, na seção 3.8.'
    ),
    sub('2.8 Registro do aceite'),
    p(
      'Guardamos a data e a hora do seu aceite, a versão deste Termo e o texto que você viu, para comprovar a sua autorização.'
    ),
    sub('2.9 Declaração'),
    p(
      'Declaro que li e entendi este Termo, que tenho 18 anos ou mais (ou que o meu responsável legal autorizou o meu uso) e que autorizo, de forma livre e expressa, o tratamento dos meus dados pessoais sensíveis para as finalidades descritas.'
    ),
    p(`Versão ${VERSAO}, vigente a partir de ${t.vigenteDesde}.`),
  ],
};

const politica = {
  titulo: 'Política de Privacidade',
  blocos: [
    p(
      `Esta política explica, em palavras simples, quais dados o Meu Diário coleta, para que os usa e como os protege. Em resumo: guardamos só o necessário, em servidor próprio da ${t.empresa}, e não passamos os seus dados a terceiros.`
    ),
    sub('3.1 Quem somos'),
    p(
      `O Meu Diário é oferecido pela ${t.empresa}. Somos o controlador: decidimos como os seus dados são usados e respondemos por eles. Para falar com o nosso encarregado de dados, escreva para ${t.encarregadoEmail}.`
    ),
    sub('3.2 Quais dados coletamos e para que usamos'),
    {
      tipo: 'tabela',
      colunas: ['Dado', 'O que é', 'Para que usamos', 'Sensível?'],
      linhas: [
        ['Nome e e-mail', 'Informados no cadastro', 'Identificar a sua conta e fazer o login', 'Não'],
        ['Senha', 'Criada por você', 'Proteger o acesso. Guardamos só uma versão criptografada, que nem a nossa equipe consegue ler', 'Não'],
        ['Data de nascimento (opcional)', 'Informada no cadastro', 'Confirmar a faixa de idade de uso', 'Não'],
        ['Áreas de interesse', 'Temas que você marca, como ansiedade, pânico e burnout', 'Adaptar o aplicativo aos temas que importam para você', 'Sim'],
        ['Emoção do dia', 'O humor que você escolhe em cada entrada', 'Montar o seu histórico e os relatórios', 'Sim'],
        ['Textos do diário', 'O que te fez bem, o que te fez mal e o que você aprendeu', 'Guardar as suas entradas para você consultar', 'Sim'],
        ['Fotos (opcional)', 'Imagem que você anexar a uma entrada', 'Ilustrar a entrada', 'Sim'],
        ['Lembretes e tags', 'Títulos, descrições, datas e horários que você criar', 'Avisar você e organizar as suas entradas', 'Depende do que você escrever'],
        ['Dados de acesso', 'Endereço IP, tipo de aparelho ou navegador, datas de login e de saída', 'Manter a conta segura e controlar as sessões', 'Não'],
      ],
    },
    p('Não coletamos localização, contatos, microfone nem dados bancários.'),
    sub('3.3 Por que podemos usar os seus dados'),
    p(
      'Para os dados sensíveis, usamos a sua autorização, dada no Termo acima. Para os demais, usamos o que é necessário para oferecer o serviço que você pediu e para manter a sua conta segura.'
    ),
    sub('3.4 Onde os seus dados ficam guardados'),
    p(
      `Os seus dados ficam em servidor próprio da ${t.empresa}, na cidade de ${t.cidade}, ${t.pais}, onde são armazenados e processados.`
    ),
    sub('3.5 Com quem compartilhamos'),
    p(
      `Com ninguém. Não vendemos, não alugamos, não divulgamos e não compartilhamos os seus dados com terceiros. Só profissionais autorizados da ${t.empresa}, com dever de sigilo, podem acessá-los, e apenas quando for necessário para manter o serviço funcionando.`
    ),
    p(
      'A única exceção é uma ordem judicial ou uma obrigação legal. Nesse caso, compartilhamos somente o que for exigido e, quando a lei permitir, avisamos você.'
    ),
    sub('3.6 Por quanto tempo guardamos'),
    p(
      `Guardamos os seus dados enquanto a sua conta existir. Ao excluir a conta pelo aplicativo, apagamos os seus dados dos nossos servidores. As cópias de segurança são eliminadas em até ${t.backupDias} dias. Só mantemos por mais tempo o que a lei exigir, como certos registros de acesso, e apenas pelo prazo legal.`
    ),
    sub('3.7 Como protegemos os seus dados'),
    lista([
      'As senhas são guardadas de forma criptografada.',
      'O acesso à conta usa sessões com validade curta, que se encerram quando você sai.',
      'Cada pessoa vê somente as próprias entradas.',
      'O acesso da nossa equipe aos dados é limitado a quem precisa dele para o trabalho.',
    ]),
    p(
      'Se ocorrer um incidente de segurança que possa trazer risco ou dano a você, avisamos você e a Autoridade Nacional de Proteção de Dados (ANPD), como a lei determina.'
    ),
    sub('3.8 Os seus direitos'),
    p('Você pode pedir, a qualquer momento e sem custo:'),
    lista([
      'a confirmação de que tratamos os seus dados e o acesso a eles;',
      'a correção de dados incompletos, errados ou desatualizados;',
      'a eliminação dos dados tratados com a sua autorização, excluindo a conta no aplicativo ou escrevendo para o encarregado;',
      'uma cópia dos seus dados, para levar a outro serviço;',
      'informação sobre com quem compartilhamos os dados (com ninguém, como explicado acima);',
      'a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desacordo com a lei;',
      'a retirada da autorização, que você pode fazer quando quiser.',
    ]),
    p(
      `Faça o pedido pelo e-mail ${t.encarregadoEmail}. Respondemos em até 15 dias. Se achar que os seus direitos não foram respeitados, você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`
    ),
    sub('3.9 Menores de 18 anos'),
    p(
      'O Meu Diário é destinado a maiores de 18 anos. Se você tem menos de 18 anos, peça a um responsável legal que leia estes documentos e autorize o seu uso. No caso de crianças, a lei exige o consentimento específico e em destaque de pelo menos um dos pais ou do responsável legal (LGPD, art. 14).'
    ),
    sub('3.10 Mudanças nesta política'),
    p(
      'Se mudarmos algo importante, avisamos você no aplicativo antes de a mudança valer. Se a mudança alterar para que usamos os seus dados sensíveis, pediremos uma nova autorização.'
    ),
    sub('3.11 Fale com a gente'),
    p(`Encarregado de dados: ${t.encarregadoNome}, ${t.encarregadoEmail}. ${t.empresa}: ${t.endereco}.`),
    p(`Versão ${VERSAO}, vigente a partir de ${t.vigenteDesde}.`),
  ],
};

// Texto simples do aviso + frase do aceite: é isso que fica gravado como prova do que o usuário viu.
function textoDoAviso() {
  const partes = [aviso.titulo];
  for (const b of aviso.blocos) {
    if (b.tipo === 'p') partes.push(b.texto);
    if (b.tipo === 'lista') partes.push(b.itens.map((i) => `- ${i}`).join('\n'));
  }
  partes.push(`[ ] ${TEXTO_ACEITE}`);
  partes.push(`Termo de Autorização e Política de Privacidade, versão ${VERSAO}.`);
  return partes.join('\n\n');
}

module.exports = { VERSAO, VIGENTE_DESDE: t.vigenteDesde, TEXTO_ACEITE, aviso, termo, politica, textoDoAviso };
