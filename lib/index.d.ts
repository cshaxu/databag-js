type Config = {
    [key: string]: string | Config;
};
declare function encrypt<T extends string | Config>(config: T, password: string): T;
declare function decrypt<T extends string | Config>(config: T, password: string): T;
export { Config, decrypt, encrypt };
