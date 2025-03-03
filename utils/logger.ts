import * as FileSystem from 'expo-file-system';

export class Logger {
  private logFile: string;
  private maxSize: number;
  private backupCount: number;

  constructor() {
    this.logFile = `${FileSystem.cacheDirectory}jobtrakr.log`;
    this.maxSize = 10 * 1024 * 1024; // 10MB
    this.backupCount = 3;
  }

  private async rotateLog() {
    const fileInfo = await FileSystem.getInfoAsync(this.logFile);
    if (fileInfo.exists && fileInfo.size > this.maxSize) {
      // Rotate existing backup files
      for (let i = this.backupCount - 1; i > 0; i--) {
        const oldFile = `${this.logFile}.${i}`;
        const newFile = `${this.logFile}.${i + 1}`;
        if (await (await FileSystem.getInfoAsync(oldFile)).exists) {
          await FileSystem.moveAsync({ from: oldFile, to: newFile });
        }
      }
      // Move current log to .1
      await FileSystem.moveAsync({
        from: this.logFile,
        to: `${this.logFile}.1`,
      });
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level}] ${message}\n`;
  }

  private async writeLog(message: string) {
    try {
      await this.rotateLog();
      await FileSystem.writeAsStringAsync(this.logFile, message, {
        encoding: FileSystem.EncodingType.UTF8,
        append: true,
      });
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  public getLogFilePath() {
    return this.logFile;
  }

  public async debug(message: string) {
    const formattedMessage = this.formatMessage('DEBUG', message);
    console.debug(message);
    await this.writeLog(formattedMessage);
  }

  public async info(message: string) {
    const formattedMessage = this.formatMessage('INFO', message);
    console.info(message);
    await this.writeLog(formattedMessage);
  }

  public async warn(message: string) {
    const formattedMessage = this.formatMessage('WARN', message);
    console.warn(message);
    await this.writeLog(formattedMessage);
  }

  public async error(message: string) {
    const formattedMessage = this.formatMessage('ERROR', message);
    console.error(message);
    await this.writeLog(formattedMessage);
  }

  public async clearLogs() {
    try {
      const fileInfo = await FileSystem.getInfoAsync(this.logFile);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(this.logFile);
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

export const logger = new Logger();
