This checks if the passed text contains any known IP logger service domain. Returns true if so, otherwise false.

Example Usage
```javascript
const antiIpLogger = require("anti-ip-logger")
console.log(antiIpLogger("https://grabify.link/FAA9S1"))
//Output: true
```