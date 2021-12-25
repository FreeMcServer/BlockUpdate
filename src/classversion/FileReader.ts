/**
 * A file reader capable of reading types in Java class files.
 * 
 * Will follow the format in the Java Virtual Machine Specification
 * {@link https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html}.
 * Values are read big endian order as per the specification.
 * 
 * @see .
 */
export default class FileReader {
    private readonly buffer: Buffer;
    private cursor: number;

    constructor(buffer: Buffer) {
        this.buffer = buffer;
        this.cursor = 0;
    }

    /**
     * Read an unsigned 8-bit integer.
     * 
     * @returns The read number.
     */
    readU1(): number {
        return this.buffer.readUIntBE(this.cursor++, 1);
    }

    /**
     * Read an unsigned 16-bit integer.
     * 
     * @returns The read number.
     */
    readU2(): number {
        const val = this.buffer.readUIntBE(this.cursor, 2);
        this.cursor += 2;
        return val;
    }

    /**
     * Read an unsigned 32-bit integer.
     * 
     * @returns The read number.
     */
    readU4(): number {
        const val = this.buffer.readUIntBE(this.cursor, 4);
        this.cursor += 4;
        return val;
    }
}