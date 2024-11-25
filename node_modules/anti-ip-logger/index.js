const fetch = require("node-fetch")
const url = require("url")

const regex = /^(https?:\/\/)?(([\da-z\.-]+)\.([a-z\.]{2,6}))([\/\w \.-]*)*\/?$/g

const knownLoggers = ["viral.over-blog.com","gyazo.in","ps3cfw.com","urlz.fr","webpanel.space","steamcommumity.com","i.imgur.com.de","www.fuglekos.com","grabify.link","leancoding.co","stopify.co","freegiftcards.co","joinmy.site","curiouscat.club","catsnthings.fun","catsnthings.com","xn--yutube-iqc.com","gyazo.nl","yip.su","iplogger.com","iplogger.org","iplogger.ru","2no.co","02ip.ru","iplis.ru","iplo.ru","ezstat.ru","www.whatstheirip.com","www.hondachat.com","www.bvog.com","www.youramonkey.com","pronosparadise.com","freebooter.pro","blasze.com","blasze.tk","ipgrab.org","i.gyazos.com"]

/**
 * Returns true if the text contains a known IP logger domain
 */
module.exports = async function(text, options){
    const matches = text.matchAll(regex)
    if(typeof options !== "object") options = {}
    
    for(const match of matches){
        //Checks the domains straight up
        if(knownLoggers.indexOf(match[2]) !== -1) return true
        //Checks if the redirect end target is an IP logger
        //This doesn't check in between redirects; Short link IP loggers bypass this
        else if(options.expandShortLinks) {
            const expanded = await fetch(`http://expandurl.com/api/v1/?url=${encodeURIComponent(match[0])}`)
            .then(res => res.text())

            const parsedURL = url.parse(expanded)
            if(knownLoggers.indexOf(parsedURL.hostname) !== -1) return true
        }
    }

    return false
}