export  function humanize(str: string) {
    if (!str) {
        return '';
    }
    return str.toString()
      .replace(/^[\s_]+|[\s_]+$/g, '')
      .replace(/[_\s]+/g, ' ')
      .replace(/^[a-z]/, function (m) {
        return m.toUpperCase();
      });
  }