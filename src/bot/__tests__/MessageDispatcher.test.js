const MessageDispatcher = require('../MessageDispatcher');

describe('MessageDispatcher', () => {
  test('dispatches to correct handler', async () => {
    const dispatcher = new MessageDispatcher();
    const handler = jest.fn();
    dispatcher.registerHandler('text', handler);
    await dispatcher.dispatch({ message: { message_type: 'text' } });
    expect(handler).toHaveBeenCalled();
  });

  test('applies filters', async () => {
    const dispatcher = new MessageDispatcher();
    const handler = jest.fn();
    dispatcher.registerHandler('text', handler);
    dispatcher.addFilter(() => false);
    await dispatcher.dispatch({ message: { message_type: 'text' } });
    expect(handler).not.toHaveBeenCalled();
  });

  test('handles missing handler', async () => {
    const dispatcher = new MessageDispatcher();
    await dispatcher.dispatch({ message: { message_type: 'unknown' } });
  });
});
