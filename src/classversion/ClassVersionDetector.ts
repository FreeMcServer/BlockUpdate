import JSZip from "jszip";
import FileReader from "./FileReader";
import * as fs from "fs";

/**
 * Utilities for detecting the class file version of a jar or class file.
 * 
 * Note that this might not be very reliable for versions that use launchers as
 * the launcher might be made for a different Java version than the server itself
 * supports.
 */
namespace ClassVersionDetector {
    /**
     * The magic number for Java class files.
     */
    const MAGIC_NUMBER = 0xCAFEBABE;

    /**
     * Detect the class file version from a jar file.
     *
     * Note that some launchers, like paperclip, might have a different class file
     * version then the server itself supports.
     *
     * @param jarPath The path to the jar.
     * @returns The class fle version.
     */
    export async function detectFromJar(jarPath: string): Promise<number> {
        const file = fs.readFileSync(jarPath);
        const zip = await JSZip.loadAsync(file);

        // The path to the class file to read.
        let classFilePath;

        // Read the manifest to find the main class and use that as the
        // class file to get the class version from.
        const manifestFile = zip.file("META-INF/MANIFEST.MF");
        if (manifestFile != null) {
            const text = await manifestFile.async("text");
            const match = /^Main-Class: (?<class>.+)$/m.exec(text);
            if (match && match.groups) {
                const mainClass = match.groups["class"];
                if (mainClass) {
                    classFilePath = mainClass.replace(/\./g, "/") + ".class";
                }
            }
        }

        if (!classFilePath) {
            // No main class found, let's use the first best one we find.
            for (const filePath in zip.files) {
                if (filePath.endsWith(".class")) {
                    classFilePath = filePath;
                    break;
                }
            }
        }

        if (!classFilePath) {
            throw new Error("The jar file had no .class files");
        }

        const classFile = zip.file(classFilePath);
        if (!classFile) {
            throw new Error("Unable to find the class file " + classFilePath);
        }
        const classFileBuffer = await classFile.async("nodebuffer");

        return ClassVersionDetector.detectFromClassFile(classFileBuffer);
    }

    /**
     * Detect the class file version from a class file.
     *
     * @param classFileBuffer The class file as a buffer.
     * @returns The class file version.
     */
    export function detectFromClassFile(classFileBuffer: Buffer) {
        const fileReader = new FileReader(classFileBuffer);

        // Read magic number
        const magic = fileReader.readU4();
        if (magic != MAGIC_NUMBER) {
            throw new Error("The read file is not a Java class file, expected " + MAGIC_NUMBER.toString(16) +" (hex) but found " + magic.toString(16) + " (hex).");
        }
        
        // Read minor class file version
        const minorVersion = fileReader.readU2();

        // Read major class file version
        const majorVersion = fileReader.readU2();

        return majorVersion;
    }
};

export default ClassVersionDetector;