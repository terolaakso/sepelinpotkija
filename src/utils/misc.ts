export const isNotNil = <T>(t: T | null | undefined): t is T => t !== undefined && t !== null;
