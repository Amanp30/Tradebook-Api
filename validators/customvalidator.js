class customvalidator {
  value = 0;

  add(num) {
    this.value += num;
    return this;
  }

  multiply(num) {
    this.value *= num;
    return this;
  }

  subtract(num) {
    this.value -= num;
    return this;
  }

  divide(num) {
    this.value /= num;
    return this;
  }

  static create() {
    return new customvalidator();
  }
}

module.exports = customvalidator;
