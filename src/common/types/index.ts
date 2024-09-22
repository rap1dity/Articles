export type TokenPayload = {
  id: number,
  username: string,
  type: string,
  deviceId: string,
  jti?: string;
}