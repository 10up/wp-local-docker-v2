const command = function() {
    return process.argv[2].toLowerCase();
};

const commandArgs = function() {
    let args = Array.prototype.slice.call( process.argv, 3 ).join( ' ' );

    return args;
};

const subcommand = function() {
    return process.argv[3].toLowerCase();
};

module.exports = { command, commandArgs, subcommand };
