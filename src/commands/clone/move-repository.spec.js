// @ts-nocheck

const { join } = require( 'path' );

const makeMoveRepository = require( './move-repository' );

describe( 'clone :: move-repository', () => {
    it( 'should export the factory function as a default export', () => {
        expect( typeof makeMoveRepository ).toBe( 'function' );
    } );

    it( 'should return a worker function', () => {
        expect( typeof makeMoveRepository( {}, {}, '' ) ).toBe( 'function' );
    } );

    describe( ':: worker function', () => {
        const spinner = {};
        const fs = {};
        const root = '/home/user/wp-local-docker/project/wordpress';
        const from = '/tmp/repo';
        const to = 'wp-content/themes/project-theme';

        beforeEach( () => {
            spinner.start = jest.fn();
            spinner.succeed = jest.fn();
            fs.move = jest.fn().mockResolvedValueOnce( true );
            fs.remove = jest.fn().mockResolvedValueOnce( true );
        } );

        it( 'should call start and succeed functions of the spinner', async () => {
            await makeMoveRepository( spinner, fs, root )( from, to );
            expect( spinner.start ).toHaveBeenCalled();
            expect( spinner.succeed ).toHaveBeenCalled();
        } );

        it( 'should call remove function to remove original folder', async () => {
            await makeMoveRepository( spinner, fs, root )( from, to );
            expect( fs.remove ).toHaveBeenCalled();
            expect( fs.remove ).toHaveBeenCalledWith( join( root, to ) );
        } );

        it( 'should call move function to move repo to the new directory', async () => {
            await makeMoveRepository( spinner, fs, root )( from, to );
            expect( fs.move ).toHaveBeenCalled();
            expect( fs.move ).toHaveBeenCalledWith( from, join( root, to ) );
        } );
    } );
} );
