const dns = require('dns'),
    Logger = require('./Logger'),
    util = require('util'),
    dnsLookupAsync = util.promisify(dns.lookup),
    dnsResolveAsync = util.promisify(dns.resolve),
    punycode = require('punycode');

class DnsResolver {
    /**
     * @param {Logger} logger
     */
    constructor(logger) {
        this.logger = logger;
    }

    isIp(host) {
        return !!host.match(/\d+\.\d+\.\d+\.\d+/);
    }

    /**
     * Response port will only be present if srv record was involved.
     * @param {string} host
     * @param {number} ipFamily
     * @param {string=} srvRecordPrefix
     * @returns {Promise<{address:string, port:number=}>}
     */
    async resolve(host, ipFamily, srvRecordPrefix) {
        this.logger.debug("DNS Lookup: " + host);

        if(this.isIp(host)) {
            this.logger.debug("Raw IP Address: " + host);
            return {address: host};
        }

        const asciiForm = punycode.toASCII(host);
        if (asciiForm !== host) {
            this.logger.debug("Encoded punycode: " + host + " -> " + asciiForm);
            host = asciiForm;
        }

        if (srvRecordPrefix) {
            this.logger.debug("SRV Resolve: " + srvRecordPrefix + '.' + host);
            let records;
            try {
                records = await dnsResolveAsync(srvRecordPrefix + '.' + host, 'SRV');
                if (records.length >= 1) {
                    this.logger.debug("Found SRV Records: ", records);
                    const record = records[0];
                    const srvPort = record.port;
                    const srvHost = record.name;
                    if (srvHost === host) {
                        throw new Error('Loop in DNS SRV records');
                    }
                    return {
                        port: srvPort,
                        ...await this.resolve(srvHost, ipFamily, srvRecordPrefix)
                    };
                }
                this.logger.debug("No SRV Record");
            } catch (e) {
                this.logger.debug(e);
            }
        }

        this.logger.debug("Standard Resolve: " + host);
        const dnsResult = await dnsLookupAsync(host, ipFamily);
        // For some reason, this sometimes returns a string address rather than an object.
        // I haven't been able to reproduce, but it's been reported on the issue tracker.
        let address;
        if (typeof dnsResult === 'string') {
            address = dnsResult;
        } else {
            address = dnsResult.address;
        }
        this.logger.debug("Found address: " + address);
        return {address: address};
    }
}

module.exports = DnsResolver;
