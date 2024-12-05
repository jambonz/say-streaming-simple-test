const text = `Hi there, how can I help you today?`
const {sentence1, sentence2} = require('./prompts');

const service = ({logger, makeService}) => {
  const svc = makeService({path: '/tts-streaming'});

  svc.on('session:new', (session) => {
    session.locals = {logger: logger.child({call_sid: session.call_sid})};
    logger.info({session}, `new incoming call: ${session.call_sid}`);

    try {
      session
        .on('close', onClose.bind(null, session))
        .on('error', onError.bind(null, session));

      session
        .answer()
        .say({stream: true})
        .send();
    } catch (err) {
      session.locals.logger.info({err}, `Error to responding to incoming call: ${session.call_sid}`);
      session.close();
    }

    setTimeout(() => {
      session.sendTtsTokens(text);
    }, 1000);

    setTimeout(() => {
      session.sendTtsTokens(sentence1);
    }, 1500);
  
    setTimeout(() => {
      session.sendTtsFlush();
    }, 8000);

    setTimeout(() => {
      session.sendTtsTokens('Thats all for now.  Are you feeling enlightened?');
    }, 15000);

  });
};

const onClose = (session, code, reason) => {
  const {logger} = session.locals;
  logger.info({session, code, reason}, `session ${session.call_sid} closed`);
};

const onError = (session, err) => {
  const {logger} = session.locals;
  logger.info({err}, `session ${session.call_sid} received error`);
};

module.exports = service;
