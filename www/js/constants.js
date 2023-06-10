const ADDRESSES = {
	 /* MoonMoonz: "0xB3508983b889509a9D37b2C60c2E72CA0c7f4e2e",
	 MoonMoonzRewarder: "0xdA5D1a651Bb1525A6457a2164A5CAB4DC6a5B133",
	 MoonMoonzWater: "0x4F9B9a446678bd53010C905fEe89336f26A67E41", */
	 MoonMoonz: "0xE416db68b7Eff40e7A4a6F2aeF60567FE11E2722",
	 MoonMoonzRewarder: "0xF1FA2373dC5a865E023df2d0e7e8E1091f9CB17A",
	 MoonMoonzWater: "0xBd9D435867BF0DEf4e6850A8568535BC4eEefcBE",
};

const ABIS = {
	MoonMoonz: [
		"function totalSupply() view returns(uint256)",
		"function saleState() view returns(uint256)",
		"function claimVIP(bytes32[])",
		"function claimWL(bytes32[]) payable",
		"function claimWaitlist(bytes32[]) payable",
		"function claim() payable",
		"function balanceOf(address) view returns(uint256)",
		"function timezoneOf(uint256) view returns(uint8)",
		"function tokenOfOwnerByIndex(address, uint256) view returns(uint256)",
		"function tokenURI(uint256) view returns(string)",
	],
	MoonMoonzRewarder: [
		"function deposit(uint256[]) external",
		"function withdraw(uint256[]) external",
		"function claim() external",
		"function earned(address) external view returns(uint256[])",
		"function depositsOf(address) external view returns(uint256[])",
	],
	MoonMoonzWater: ["function balanceOf(address) view returns(uint256)"],
};

const PRICE = ethers.utils.parseEther("0.0088");

const API = "https://moonmoonz-api.up.railway.app";
