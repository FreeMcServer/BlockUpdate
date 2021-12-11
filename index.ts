import {exec} from 'child_process';

exec('java -jar ./buildtools/BuildTools.jar --rev 1.18', (err, stdout, stderr) => {
    // your callback
    console.log(stdout);
    console.log(stderr);
    console.log(err);
});
