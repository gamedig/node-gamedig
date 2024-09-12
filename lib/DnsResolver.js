import dns from 'node:dns'
import { isIP } from 'node:net'
import { domainToASCII } from 'node:url'

export default class DnsResolver {
  /**
     * @param {Logger} logger
     */
  constructor (logger) {
    this.logger = logger
  }

  /**
     * Resolve a host name to its IP, if the given host name is already
     * an IP address no request is made.
     *
     * If a srvRecordPrefix is provided a SRV request will be made and the
     * port returned will be included in the output.
     * @param {string} host
     * @param {number} ipFamily
     * @param {string=} srvRecordPrefix
     * @returns {Promise<{address:string, port:number=}>}
     */
  async resolve (host, ipFamily, srvRecordPrefix) {
    this.logger.debug('DNS Lookup: ' + host)

    // Check if host is IPv4 or IPv6
    if (isIP(host) === 4 || isIP(host) === 6) {
      this.logger.debug('Raw IP Address: ' + host)
      return { address: host }
    }

    const asciiForm = domainToASCII(host)
    if (!asciiForm) {
      throw new Error('Invalid domain')
    }

    if (asciiForm !== host) {
      this.logger.debug('Encoded punycode: ' + host + ' -> ' + asciiForm)
      host = asciiForm
    }

    if (srvRecordPrefix) {
      this.logger.debug('SRV Resolve: ' + srvRecordPrefix + '.' + host)
      let records
      try {
        records = await dns.promises.resolve(srvRecordPrefix + '.' + host, 'SRV')
        if (records.length >= 1) {
          this.logger.debug('Found SRV Records: ', records)
          const record = records[0]
          const srvPort = record.port
          const srvHost = record.name
          if (srvHost === host) {
            throw new Error('Loop in DNS SRV records')
          }
          return {
            port: srvPort,
            ...await this.resolve(srvHost, ipFamily, srvRecordPrefix)
          }
        }
        this.logger.debug('No SRV Record')
      } catch (e) {
        this.logger.debug(e)
      }
    }

    this.logger.debug('Standard Resolve: ' + host)
    const dnsResult = await dns.promises.lookup(host, ipFamily)
    // For some reason, this sometimes returns a string address rather than an object.
    // I haven't been able to reproduce, but it's been reported on the issue tracker.
    let address
    if (typeof dnsResult === 'string') {
      address = dnsResult
    } else {
      address = dnsResult.address
    }
    this.logger.debug('Found address: ' + address)
    return { address }
  }
}
