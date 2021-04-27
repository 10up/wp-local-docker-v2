#/usr/bin/env bash

_compreply() {
    local options="$*"
    local cur_word="${COMP_WORDS[COMP_CWORD]}"

    COMPREPLY=($(compgen -W "${options}" -- "${cur_word}"))

    return 0
}

_10updocker_environments_completion() {
    local env_utils="$( cd "$( dirname "$( dirname "${BASH_SOURCE[0]}" )" )" >/dev/null 2>&1 && pwd )"
    local script="
(async () => {
    let envs = [];

    try {
        envs = await require('${env_utils}/src/env-utils.js').getAllEnvironments();
    } catch( e ) {
    }

    envs.push( 'all' );
    process.stdout.write( envs.join( ' ' ) );
})();
"

    _compreply "$(node -e "$script")"

    return 0
}

_10updocker_completion() {
    # Unfortunately, if we want to use "wp cli completions" command, we need to execute this command within a container,
    # but we don't know which environment we need to use and whether it is started or not. So we fallback to the list of 
    # main commands defined on the official site: https://developer.wordpress.org/cli/commands/
    local wp_commands=(
        "admin" "cache" "cap" "cli" "comment" "config" "core" "cron" "db" "dist-archive" "embed" "eval" "eval-file"
        "export" "find" "help" "i18n" "import" "language" "maintenance-mode" "media" "menu" "network" "option" "package"
        "plugin" "post" "post-type" "profile" "rewrite" "role" "scaffold" "search-replace" "server" "shell" "sidebar"
        "site" "super-admin" "taxonomy" "term" "theme" "transient" "user" "widget"
    )

    if [ ${COMP_CWORD} -eq 1 ]; then
        _compreply cache clone configure create new delete remove rm image logs list ls cert init migrate restart shell start stop wp wpspanshots spanshots upgrade
    elif [ ${COMP_CWORD} -eq 2 ]; then
        case ${COMP_WORDS[1]} in
            cache)
                _compreply clear
                ;;
            image)
                _compreply update
                ;;
            delete | remove | start | stop | restart)
                _10updocker_environments_completion
                ;;
            wp)
                _compreply "${wp_commands[@]}"
                ;;
            cert)
                _compreply install generate
                ;;
        esac
    elif [ ${COMP_CWORD} -eq 3 ]; then
        case ${COMP_WORDS[1]} in
            migrate)
                _10updocker_environments_completion
                ;;
            wp)
                case ${COMP_WORDS[2]} in
                    cache)
                        _compreply add decr delete flush get incr replace set type
                        ;;
                    cap)
                        _compreply add list remove
                        ;;
                    cli)
                        _compreply alias cache check-update cmd-dump completions has-command info param-dump update version
                        ;;
                    comment)
                        _compreply approve count create delete exists generate get list meta recount spam status trash unapprove unspam untrash update
                        ;;
                    config)
                        _compreply create delete edit get has list path set shuffle-salts
                        ;;
                    core)
                        _compreply check-update download install is-installed multisite-install multisite-convert update update-db verify-checksums version
                        ;;
                    cron)
                        _compreply event schedule test
                        ;;
                    db)
                        _compreply check clean cli columns create drop export import optimize prefix query repair reset search size tables
                        ;;
                    embed)
                        _compreply cache fetch handler provider
                        ;;
                    i18n)
                        _compreply make-json make-pot
                        ;;
                    language)
                        _compreply core plugin theme
                        ;;
                    maintenance-mode)
                        _compreply activate deactivate is-active status
                        ;;
                    media)
                        _compreply fix-orientation image-size import regenerate
                        ;;
                    menu)
                        _compreply create delete item list location
                        ;;
                    network)
                        _compreply meta
                        ;;
                    option)
                        _compreply add delete get list patch pluck update
                        ;;
                    package)
                        _compreply browse install list path uninstall update
                        ;;
                    plugin)
                        _compreply activate deactivate delete get install uninstall is-active is-installed list path search status toggle uninstall update verify-checksums
                        ;;
                    post)
                        _compreply create delete edit exists generate get list meta term update
                        ;;
                    post-type)
                        _compreply get list
                        ;;
                    profile)
                        _compreply eval eval-file hook stage
                        ;;
                    rewrite)
                        _compreply flush list structure
                        ;;
                    role)
                        _compreply create delete exists list reset
                        ;;
                    scaffold)
                        _compreply block child-theme plugin plugin-tests post-type taxonomy theme-tests
                        ;;
                    sidebar)
                        _compreply list
                        ;;
                    site)
                        _compreply activate archive create deactivate delete empty list mature meta option private public spam switch-language unarchive unmature unspam
                        ;;
                    super-admin)
                        _compreply add list remove
                        ;;
                    taxonomy)
                        _compreply get list
                        ;;
                    term)
                        _compreply create delete generate get list meta migrate recount update
                        ;;
                    theme)
                        _compreply activate delete disable enable get install is-active is-installed list mod path search status update
                        ;;
                    transient)
                        _compreply delete get list set type
                        ;;
                    user)
                        _compreply add-cap add-role check-password create delete generate get import-csv list list-caps meta remove-cap remove-role reset-password session spam term unspam update
                        ;;
                    widget)
                        _compreply add deactivate delete list move reset update
                        ;;
                esac
                ;;
        esac
    elif [ ${COMP_CWORD} -eq 4 -a ${COMP_WORDS[1]} == "wp" ]; then
        case ${COMP_WORDS[2]} in
            cli)
                case ${COMP_WORDS[3]} in
                    alias)
                        _compreply add delete get list update
                        ;;
                    cache)
                        _compreply clear prune
                        ;;
                esac
                ;;
            comment)
                case ${COMP_WORDS[3]} in
                    meta)
                        _compreply add delete get list patch pluck update
                        ;;
                esac
                ;;
            cron)
                case ${COMP_WORDS[3]} in
                    event)
                        _compreply delete list run schedule
                        ;;
                    schedule)
                        _compreply list
                        ;;
                esac
                ;;
            emebd)
                case ${COMP_WORDS[3]} in
                    cache)
                        _compreply clear find trigger
                        ;;
                    handler)
                        _compreply list
                        ;;
                    provider)
                        _compreply list match
                        ;;
                esac
                ;;
            language)
                case ${COMP_WORDS[3]} in
                    core)
                        _compreply activate install is-installed list uninstall update
                        ;;
                    plugin | theme)
                        _compreply install is-installed list uninstall update
                        ;;
                esac
                ;;
            network)
                case ${COMP_WORDS[3]} in
                    meta)
                        _compreply add delete get list patch pluck update
                        ;;
                esac
                ;;
            post)
                case ${COMP_WORDS[3]} in
                    meta)
                        _compreply add delete get list patch pluck update
                        ;;
                    term)
                        _compreply add list remove set
                        ;;
                esac
                ;;
            site)
                case ${COMP_WORDS[3]} in
                    meta | option)
                        _compreply add delete get list patch pluck update
                        ;;
                esac
                ;;
            term)
                case ${COMP_WORDS[3]} in
                    meta)
                        _compreply add delete get list patch pluck update
                        ;;
                esac
                ;;
            theme)
                case ${COMP_WORDS[3]} in
                    mod)
                        _compreply get list remove set
                        ;;
                esac
                ;;
            user)
                case ${COMP_WORDS[3]} in
                    meta)
                        _compreply add delete get list patch pluck update
                        ;;
                    session)
                        _compreply destroy list
                        ;;
                    term)
                        _compreply add list remove set
                        ;;
                esac
                ;;
        esac
    fi

    if [ ${#COMPREPLY[@]} -eq 0 ]; then
        COMPREPLY=()
    fi

    return 0
}

_10updcoker_hosts_completion() {
    if [ ${#COMP_WORDS[@]} -eq 2 ]; then
        COMPREPLY=($(compgen -W "add remove" -- "${COMP_WORDS[COMP_CWORD]}"))
    fi

    return 0
}

complete -o default -F _10updocker_completion 10updocker
complete -o default -F _10updcoker_hosts_completion 10updocker-hosts
