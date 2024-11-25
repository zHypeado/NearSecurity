const antiIpLogger = require("./index")

//Should output true because you can clearly see "grabify.link"
console.log("1:", antiIpLogger("https://grabify.link/FAA9S1"))

//Should output false because it is just a link shortener to an IP logger, but there is no supplied "LogiciOne URL Expander" key to scan redirects
console.log("2:", antiIpLogger("shorturl.at/cqvWX"))

//Should output true because the first re-direct in the url expansion leads to grabify.link
antiIpLogger("shorturl.at/cqvWX", {expandShortLinks: true}).then(res => console.log("3:", res))