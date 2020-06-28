const {
    downloadDevelop,
    download,
    configure,
    install,
    setRewrites,
    emptyContent,
} = require( '../../wordpress' );

module.exports = function makeInstallWordPress() {
    return async ( envSlug, answers ) => {
        const {
            hostname,
            wordpress,
            wordpressType,
            emptyContent: clearContent,
        } = answers;

        if ( wordpress === true ) {
            if ( wordpressType === 'dev' ) {
                await downloadDevelop( envSlug );
            } else {
                await download( envSlug );
            }

            await configure( envSlug );
            await install( envSlug, hostname, answers );
            await setRewrites( envSlug );

            if ( clearContent === true ) {
                await emptyContent( envSlug );
            }
        }
    };
};
