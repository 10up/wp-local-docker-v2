module.exports = function makeGitClone( executor ) {
    return async ( url, branch ) => {
        await executor(
            'Initializing an empty repository...',
            [ 'git', 'init' ],
            'Initialized empty repository...',
        );

        await executor(
            'Adding a new remote to the repository...',
            [ 'git', 'remote', 'add', 'origin', url ],
            'Added a new remote to the repository...',
        );

        await executor(
            'Downloading objects and refs from the repository...',
            [ 'git', 'fetch', 'origin' ],
            'Downloaded objects and refs from the remote repository...',
        );

        await executor(
            `Checking out the ${ branch } branch...`,
            [ 'git', 'checkout', `origin/${ branch }`, '-b', branch ],
            `Checked out the ${ branch } branch...`,
        );
    };
};
