const chalk = require( 'chalk' );
const { table } = require( 'table' );

module.exports = function makeTable( data ) {
	const border = {
		topBody: '─',
		topJoin: '┬',
		topLeft: '┌',
		topRight: '┐',

		bottomBody: '─',
		bottomJoin: '┴',
		bottomLeft: '└',
		bottomRight: '┘',

		bodyLeft: '│',
		bodyRight: '│',
		bodyJoin: '│',

		joinBody: '─',
		joinLeft: '├',
		joinRight: '┤',
		joinJoin: '┼'
	};

	return table(
		data,
		{
			border: Object
				.keys( border )
				.reduce( ( accumulator, key ) => ( {
					...accumulator,
					[ key ]: chalk.grey( border[ key ] ),
				} ), {} ),
		},
	);
};
