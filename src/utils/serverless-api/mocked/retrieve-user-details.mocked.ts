export async function retrieveDiscordUserDetailsMockedCall(
  _backendJWT: string
): Promise<{
  discordId: string;
  discordName: string;
  discordAvatar: string;
  walletLinked?: string;
}> {
  return {
    discordId: "12345",
    discordName: "Discord User",
    discordAvatar: "https://picsum.photos/200",
    walletLinked: "0x815546E2E35dC9aC8A90f001cc7A859f4b21E1fd",
  };
}
