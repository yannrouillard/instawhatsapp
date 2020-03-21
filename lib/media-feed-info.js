class MediaFeedInfo {
  constructor({ account, name }) {
    this.account = account;
    this.name = name;
  }

  id() {
    return this.account + (this.name ? `-${this.name}` : '');
  }
}

module.exports = MediaFeedInfo;
