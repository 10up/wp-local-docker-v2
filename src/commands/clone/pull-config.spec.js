// @ts-nocheck

const { mkdtempSync, writeFileSync } = require( 'fs' );
const { join } = require( 'path' );
const { tmpdir } = require( 'os' );

const { remove } = require( 'fs-extra' );

const makePullConfig = require( './pull-config' );

describe( 'clone :: pull-config', () => {
	it( 'should export the factory function as a default export', () => {
		expect( typeof makePullConfig ).toBe( 'function' );
	} );

	it( 'should return a worker function', () => {
		expect( typeof makePullConfig( {} ) ).toBe( 'function' );
	} );

	describe( ':: worker function', () => {
		const spinner = {};
		const config = 'wp-local-docker.json';
		let cwd;

		beforeEach( () => {
			cwd = mkdtempSync( join( tmpdir(), 'wpld-jest-' ) );

			spinner.succeed = jest.fn();
			spinner.warn = jest.fn();
		} );

		afterEach( async () => {
			await remove( cwd );
		} );

		it( 'should call spinner.warn function when config file does not exist', async () => {
			await makePullConfig( spinner )( cwd, config );
			expect( spinner.succeed ).not.toHaveBeenCalled();
			expect( spinner.warn ).toHaveBeenCalled();
		} );

		it( 'should return default value if a config does not exist', async () => {
			const defaults = {
				hostname: 'my-project.test',
				phpVersion: '7.4',
			};

			const results = await makePullConfig( spinner )( cwd, config, defaults );
			expect( results ).toEqual( defaults );
		} );

		it( 'should return data read from the config file when it exists', async () => {
			const data = {
				hostname: 'my-project.test',
				phpVersion: '7.4',
			};

			writeFileSync( join( cwd, config ), JSON.stringify( data ) );

			const results = await makePullConfig( spinner )( cwd, config, false );
			expect( results ).toEqual( data );
		} );

		it( 'should call spinner.succeed function when config file exists', async () => {
			const data = {
				hostname: 'my-project.test',
				phpVersion: '7.4',
			};

			writeFileSync( join( cwd, config ), JSON.stringify( data ) );

			await makePullConfig( spinner )( cwd, config );
			expect( spinner.succeed ).toHaveBeenCalled();
			expect( spinner.warn ).not.toHaveBeenCalled();
		} );
	} );
} );
