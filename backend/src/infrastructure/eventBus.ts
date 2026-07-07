import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  emit(eventName: string | symbol, ...args: any[]): boolean {
    console.log(`[EventBus] Emitting event: ${String(eventName)}`);
    return super.emit(eventName, ...args);
  }
}

export const eventBus = new EventBus();
console.log('[EventBus] Initialized successfully');
