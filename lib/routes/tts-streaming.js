const text = `Hi there, how can I help you today?`
const {sentence1, sentence2} = require('./prompts');

const service = ({logger, makeService}) => {
  const svc = makeService({path: '/tts-streaming'});

  svc.on('session:new', (session) => {
    session.locals = {logger: logger.child({call_sid: session.call_sid})};
    logger.debug({session}, `new incoming call: ${session.call_sid}`);

    try {
      session
        .on('tts:streaming-event', onStreamingEvent.bind(null, session))
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
      session.sendTtsTokens(text)
        .catch((err) => {
          logger.error({err}, 'error sending TTS tokens');
        });
    }, 1000);

    setTimeout(() => {
      /**
       * We dont need to concern ourselves with whether we have sent too much data to the server.
       * The node-client-ws will handle a 'full' response from server, queue the tokens,
       * and then resume sending when the server sends a 'resume' message.
       */
      session.sendTtsTokens(sentence1).catch((err) => logger.error({err}, 'error sending TTS tokens'));
      session.sendTtsTokens(sentence2).catch((err) => logger.error({err}, 'error sending TTS tokens'));
    }, 1500);
  
    /*
    setTimeout(() => {
      session.sendTtsFlush();
    }, 20000);

    setTimeout(() => {
      session.sendTtsTokens('Thats all for now.  Are you feeling enlightened?')
      .catch((err) => {
        logger.error({err}, 'error sending TTS tokens');
      });
    }, 25000);
    */
  });
};

const onStreamingEvent = (session, event) => {
  const {logger} = session.locals;
  logger.info({event}, `session ${session.call_sid} received streaming event`);
}

const onClose = (session, code, reason) => {
  const {logger} = session.locals;
  logger.debug({session, code, reason}, `session ${session.call_sid} closed`);
};

const onError = (session, err) => {
  const {logger} = session.locals;
  logger.info({err}, `session ${session.call_sid} received error`);
};

module.exports = service;
