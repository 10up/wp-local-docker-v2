#!/usr/bin/env node

const execSync = require('child_process').execSync;

var help = function() {
    console.log( 'gateway help' );
};

function start() {
    try {
        execSync('docker network create wplocaldocker');
    } catch ( ex ) {}

    try {
        execSync('docker run -d --name wplocaldocker-gateway -p 80:80 --network wplocaldocker -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy');
    } catch ( ex ) {}

}

function restart() {
    try {
        execSync('docker restart wplocaldocker-gateway');
    } catch ( ex ) {}

}

function stop() {
    try {
        execSync('docker stop wplocaldocker-gateway');
    } catch ( ex ) {}
}

function remove() {
    try {
        execSync('docker rm wplocaldocker-gateway');
    } catch ( ex ) {}
}

if ( process.argv.length < 4 ) {
    help();
} else {
    switch( process.argv[3].toLowerCase() ) {
        case 'start':
            start();
            break;
        case 'restart':
            restart();
            break;
        case 'stop':
            stop();
            break;
        case 'remove':
            remove();
            break;
        default:
            help();
            break;
    }
}
