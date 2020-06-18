module.exports = function makeGitClone( executor ) {
    return ( url, branch ) => {
        executor( 'git init' );
        executor( `git remote add origin ${ url }` );
        executor( 'git fetch origin' );
        executor( `git checkout origin/${ branch } -b ${ branch }` );
    };
};
