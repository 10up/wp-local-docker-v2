#/usr/bin/env bash

_10updocker_environments_completion() {
    local cur_word="${COMP_WORDS[COMP_CWORD]}"
    local env_utils="$( cd "$( dirname "$( dirname "${BASH_SOURCE[0]}" )" )" >/dev/null 2>&1 && pwd )"
    local script="
(async () => {
    const envs = await require('${env_utils}/src/env-utils.js').getAllEnvironments().catch( () => [] );
    process.stdout.write( ( envs || [] ).join( ' ' ) + ' all' );
})()"

    local all_envs="$(node -e "$script")"
    COMPREPLY=($(compgen -W "${all_envs}" -- "${cur_word}"))
}

_10updocker_completion() {
    local env_utils all_envs commands cur_word

    commands="cache configure create delete remove image logs migrate restart shell start stop wp wpspanshots spanshots upgrade"
    cur_word="${COMP_WORDS[COMP_CWORD]}"

    if [ ${COMP_CWORD} -eq 1 ]; then
        COMPREPLY=($(compgen -W "${commands}" -- "${cur_word}"))
    elif [ ${COMP_CWORD} -eq 2 ]; then
        case ${COMP_WORDS[1]} in
            cache)
                COMPREPLY=($(compgen -W "clear" -- "${cur_word}"))
                ;;
            image)
                COMPREPLY=($(compgen -W "update" -- "${cur_word}"))
                ;;
            delete | remove | start | stop | restart)
                _10updocker_environments_completion
                ;;
        esac
    elif [ ${COMP_CWORD} -eq 3 ]; then
        case ${COMP_WORDS[1]} in
            migrate)
                _10updocker_environments_completion
                ;;
        esac
    fi

    if [ ${#COMPREPLY[@]} -eq 0 ]; then
        COMPREPLY=()
    fi
}

_10updcoker_hosts_completion() {
    if [ ${#COMP_WORDS[@]} -eq 2 ]; then
        COMPREPLY=($(compgen -W "add remove" -- "${COMP_WORDS[COMP_CWORD]}"))
    fi
}

complete -o default -F _10updocker_completion 10updocker
complete -o default -F _10updcoker_hosts_completion 10updocker-hosts
