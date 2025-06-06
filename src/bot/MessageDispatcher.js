class MessageDispatcher {
  constructor(options = {}) {
    this.handlers = {};
    this.filters = [];
    if (Array.isArray(options.allowedChats)) {
      this.addFilter((event) => options.allowedChats.includes(event.chat_id));
    }
    // ignore messages sent by bots by default
    this.addFilter((event) => event.sender?.sender_type !== 'bot');
  }

  registerHandler(type, handler) {
    this.handlers[type] = handler;
  }

  addFilter(filter) {
    this.filters.push(filter);
  }

  async dispatch(event) {
    if (!event || !event.message) return;
    for (const filter of this.filters) {
      try {
        if (!filter(event)) {
          return;
        }
      } catch (err) {
        // ignore filter errors
        return;
      }
    }
    const type = event.message.message_type;
    const handler = this.handlers[type];
    if (handler) {
      await handler(event);
    }
  }
}

module.exports = MessageDispatcher;
