const dns = require('dns');

const AWS = require('aws-sdk');
const config = require('config');
const publicIp = require('public-ip');

const route53 = new AWS.Route53({
    accessKeyId: config.aws.accessKeyID,
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
    return new Promise((resolve, reject)=>{
        const params = {
            ChangeBatch: {
                Changes: [
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: config.dns.fqdn,
                            Type: config.ip == '4' ? 'A' : 'AAAA',
                            TTL: config.dns.ttl,
                            ResourceRecords: [
                                {
                                    Value: ip
                                }
                            ]
                        }
                    }
                ]
            },
            HostedZoneId: config.aws.hostedZoneID
        };
        //console.log(params);
        route53.changeResourceRecordSets(params, (err, data)=>{
            if (err) {
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
}


async function main() {
    const ip = await getIp();
    const currentDNSIp = await lookupCurrentIp();

    if (ip != currentDNSIp) {
        console.log(`FQDN '${config.dns.fqdn}' currently resolves to '${currentDNSIp}'. Updating to '${ip}'`);
        const data = await setIp(ip);
        console.log("Change issues. Currently pending...");
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
