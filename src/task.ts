import chalk from 'chalk';// 改变屏幕文字颜色
import type {Gulp} from 'gulp'
import log from "./log";
import formatError from "./format-error";
import prettyTime from "pretty-time"

export interface Evt {
    uid: number,
    name: string,
    branch: boolean,
    time: number
}

let tasks: { [key: number]: string } = {};

function warn() {
    const taskKeys = Object.keys(tasks);

    if (!taskKeys.length) {
        return;
    }

    const taskNames = taskKeys.map(function (key) {
        return tasks[key as unknown as number];
    }).join(', ');

    process.exitCode = 1;

    console.log(
        chalk.red('The following tasks did not complete:'),
        chalk.cyan(taskNames)
    );
    console.log(
        chalk.red('Did you forget to signal async completion?')
    );
}

function start(e: Evt) {
    tasks[e.uid] = e.name;
}

function clear(e: Evt) {
    delete tasks[e.uid];
}

function clearAll() {
    tasks = {};
}

export function logSyncTask(gulpInst: Gulp) {

    process.once('exit', warn);
    gulpInst.on('start', start);
    gulpInst.on('stop', clear);
    // When not running in --continue mode, we need to clear everything on error to avoid
    // false positives.
    gulpInst.on('error', clearAll);
}

// Wire up logging events
export function logEvents(gulpInst: Gulp) {

    const loggedErrors: any[] = [];

    gulpInst.on('start', function (evt) {
        /* istanbul ignore next */
        // TODO: batch these
        // so when 5 tasks start at once it only logs one time with all 5
        const level = evt.branch ? 'debug' : 'info';
        log[level]('Starting', '\'' + chalk.cyan(evt.name) + '\'...');
    });

    gulpInst.on('stop', function (evt) {
        const time = prettyTime(evt.duration);
        /* istanbul ignore next */
        const level = evt.branch ? 'debug' : 'info';
        log[level](
            'Finished', '\'' + chalk.cyan(evt.name) + '\'',
            'after', chalk.magenta(time)
        );
    });

    gulpInst.on('error', function (evt) {
        const msg = formatError(evt);
        const time = prettyTime(evt.duration);
        const level = evt.branch ? 'debug' : 'error';
        log[level](
            '\'' + chalk.cyan(evt.name) + '\'',
            chalk.red('errored after'),
            chalk.magenta(time)
        );

        // If we haven't logged this before, log it and add to list
        if (loggedErrors.indexOf(evt.error) === -1) {
            log.error(msg);
            loggedErrors.push(evt.error);
        }
    });
}

