const dns = require('dns');

const AWS = require('aws-sdk');
const config = require('config');
const publicIp = require('public-ip');

const route53 = new AWS.Route53({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
});


function getIp() {
    return config.ip == '4' ? publicIp.v4() :  publicIp.v6();
}


function lookupCurrentIp() {
    return new Promise((resolve, reject)=>{
        const resolveFunc = config.ip == '4' ? dns.resolve4 : dns.resolve6;
        resolveFunc(config.dns.fqdn, (err, addrs)=>{
            if (err) {
                return reject(err);
            }
            return resolve(addrs[0]);
        });
    });
}


function setIp(ip) {
    throw `NOT YET IMPLEMENTED`;
}


async function main() {
    const ip = await getIp();
    const currentDNSIp = await lookupCurrentIp();

    if (ip != currentDNSIp) {
        console.log(`FQDN '${config.dns.fqdn}' currently resolves to '${currentDNSIp}'. Updating to '${ip}'`);
        setIp(ip);
    } else {
        console.log(`Currently FQDN '${config.dns.fqdn}' has the correct ip of '${ip}'. Finishing.`);
    }
}


if (require.main === module) {
    main().catch(err=>{
        console.error(err);
        process.exit(1);
    });
}

module.exports = main;
