// Example usage:
// const stack = new Stack<number>();
// stack.push(1);
// stack.push(2);
// console.log(stack.pop()); // Output: 2
// console.log(stack.peek()); // Output: 1
// console.log(stack.isEmpty()); // Output: false
// console.log(stack.size()); // Output: 1
// stack.clear();
// console.log(stack.isEmpty()); // Output: true

export class Stack<T> {
  private items: T[] = [];

  // Push an item onto the stack
  push(item: T): void {
    this.items.push(item);
  }

  // Pop an item off the stack
  pop(): T | undefined {
    return this.items.pop();
  }

  // Peek at the top item of the stack without removing it
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  // Peek at the top item of the stack without removing it
  get(index: number): T | undefined {
    if (index >= 0 && index < this.items.length) {
      return this.items[index];
    } else {
      return undefined;
    }
  }

  // Check if the stack is empty
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  // Get the size of the stack
  size(): number {
    return this.items.length;
  }

  // Clear the stack
  clear(): void {
    this.items = [];
  }
}
