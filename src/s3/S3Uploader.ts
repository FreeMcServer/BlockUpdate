import {execSync} from "child_process";


class S3Uploader {

    public async syncS3Storage(localFolder: string, dstFolder: string) {
        if (process.env.S3_UPLOAD !== "true") {
            console.log("Uploading to S3 skipped");
            return;
        }
        console.log("Uploading to S3");
        let rx = await execSync('s3cmd sync --host=' + process.env.S3_ENDPOINT + ' --host-bucket=' + process.env.S3_ENDPOINT + ' --access_key=' + process.env.S3_KEY + ' --secret_key=' + process.env.S3_SECRET + ' -v ' + localFolder + ' s3://' + process.env.S3_BUCKET + '/' + dstFolder + '/');
        console.log(rx.toString());
    }
}

export default S3Uploader;
