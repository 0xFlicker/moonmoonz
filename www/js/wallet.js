const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const moonMoonz = new ethers.Contract(
	ADDRESSES.MoonMoonz,
	ABIS.MoonMoonz,
	signer
);

const moonMoonzRewarder = new ethers.Contract(
	ADDRESSES.MoonMoonzRewarder,
	ABIS.MoonMoonzRewarder,
	signer
);

const moonMoonzWater = new ethers.Contract(
	ADDRESSES.MoonMoonzWater,
	ABIS.MoonMoonzWater,
	signer
);

/* -------------------------------------------------------------------------- */
/*                              General Functions                             */
/* -------------------------------------------------------------------------- */

// Connect wallet
async function connect() {
	await provider.send("eth_requestAccounts", []);

	//get Accs and APIs
	const acc = await ethereum.request({
		method: "eth_accounts",
	});

	if (!acc.length) {
		console.log("Metamask is not connected");
	}

	window.location.reload();
}

// Get address if connected else return null
async function getAddress() {
	try {
		return await signer.getAddress();
	} catch {
		return null;
	}
}

function storeError(error) {
	console.log(error);
	Alpine.store("error", error);
	Alpine.start();
}

function getError(error) {
	return error.error.message.split("execution reverted: ")[1];
}

function formatAmount(amount) {
	if (amount.isZero()) return "0";

	const _amount = ethers.utils.formatEther(amount.toString());
	return _amount.split(".")[0] + "." + _amount.split(".")[1].slice(0, 2);
}

/* -------------------------------------------------------------------------- */
/*                             MoonMoonz Functions                            */
/* -------------------------------------------------------------------------- */

async function fetchProof(addr, sale) {
	try {
		const response = await (await fetch(`${API}/${sale}/${addr}`)).json();
		if ("error" in response) throw "Not whitelisted";

		return response.proof;
	} catch (error) {
		storeError(error.message);
	}
}

// Claim 1 token during vip sale
async function claimVIP(addr) {
	const proof = await fetchProof(addr, "vip");
	if (!proof) throw "Not whitelisted";

	try {
		await moonMoonz.claimVIP(proof);
	} catch (error) {
		storeError(getError(error));
	}
}

// Claim 1 token during wl sale
async function claimWL(addr) {
	const proof = await fetchProof(addr, "wl");
	if (!proof) throw "Not whitelisted";

	try {
		await moonMoonz.claimWL(proof, { value: PRICE });
	} catch (error) {
		storeError(getError(error));
	}
}

// Claim 1 token during wl sale
async function claimWaitlist(addr) {
	const proof = await fetchProof(addr, "waitlist");
	if (!proof) throw "Not whitelisted";

	try {
		await moonMoonz.claimWaitlist(proof, { value: PRICE });
	} catch (error) {
		storeError(getError(error));
	}
}

// Claim 1 token during public sale
async function claim() {
	try {
		await moonMoonz.claim({ value: PRICE });
	} catch (error) {
		storeError(getError(error));
	}
}

// Claim a token depending on the sale state
async function mint() {
	const addr = await getAddress();
	if (!addr) storeError("Wallet not connected");

	const saleState = await getSaleState();

	if (saleState === 0) storeError("Sale hasn't started yet!");
	else if (saleState === 1) claimVIP(addr);
	else if (saleState === 2) claimWL(addr);
	else if (saleState === 3) claimWaitlist(addr);
	else if (saleState === 4) claim();
}

// Get totalSupply
async function getTotalSupply() {
	try {
		return (await moonMoonz.totalSupply()).toNumber();
	} catch {
		console.error(error);
		return 0;
	}
}

// Get sale state
async function getSaleState() {
	try {
		return (await moonMoonz.saleState()).toNumber();
	} catch {
		console.error(error);
		return 0;
	}
}

// Get token image
async function getImage(id) {
	try {
		let uri = await moonMoonz.tokenURI(id);

		if (uri.startsWith("ipfs://")) {
			uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
		}

		let { image } = await (await fetch(uri)).json();

		if (image.startsWith("ipfs://")) {
			image = image.replace("ipfs://", "https://ipfs.io/ipfs/");
		}

		return image;
	} catch (error) {
		console.error(error);
		return {};
	}
}

// Get tokens of account
async function tokensOf() {
	try {
		const addr = await getAddress();
		if (!addr) storeError("Wallet not connected");

		const fetchToken = async (index) => {
			const id = (await moonMoonz.tokenOfOwnerByIndex(addr, index)).toNumber();
			const timezone = await moonMoonz.timezoneOf(id);
			const image = await getImage(id);

			return {
				id,
				timezone,
				image,
			};
		};

		const balance = (await moonMoonz.balanceOf(addr)).toNumber();
		let tokens = Promise.all([...Array(balance).keys()].map(fetchToken));

		return tokens;
	} catch (error) {
		console.error(error);
		return [];
	}
}

// Returns if it's night at certain timezone
function isNight(timezone) {
	const START = 1640995200;

	const start =
		timezone == 0 ? START : timezone == 1 ? START + 18000 : START - 18000;

	const elapsedToday = (Math.floor(Date.now() / 1000) - start) % 86400;

	return elapsedToday < 21600 || elapsedToday >= 64800;
}

/* -------------------------------------------------------------------------- */
/*                         MoonMoonzRewarder Functions                        */
/* -------------------------------------------------------------------------- */

async function deposit(ids) {
	if (ids.length === 0) return;

	try {
		await moonMoonzRewarder.deposit(ids);
	} catch (error) {
		console.error(error);
	}
}

async function withdraw(ids) {
	if (ids.length === 0) return;

	try {
		await moonMoonzRewarder.withdraw(ids);
	} catch (error) {
		console.error(error);
	}
}

async function waterClaim() {
	try {
		const addr = await getAddress();
		if (!addr) throw "Wallet not connected";

		await moonMoonzRewarder.claim();
	} catch (error) {
		console.error(error);
	}
}

async function waterEarned() {
	try {
		const addr = await getAddress();
		if (!addr) throw "Wallet not connected";

		return formatAmount(
			(await moonMoonzRewarder.earned(addr)).reduce(
				(prev, curr) => prev.add(curr),
				ethers.BigNumber.from(0)
			)
		);
	} catch (error) {
		console.error(error);
	}
}

async function waterBalance() {
	try {
		const addr = await getAddress();
		if (!addr) throw "Wallet not connected";

		return formatAmount(await moonMoonzWater.balanceOf(addr));
	} catch (error) {
		console.error(error);
	}
}

// Get deposited tokens of account
async function depositsOf() {
	try {
		const addr = await getAddress();
		if (!addr) storeError("Wallet not connected");

		const fetchToken = async (id) => {
			id = id.toNumber();
			const timezone = await moonMoonz.timezoneOf(id);
			const image = await getImage(id);

			return {
				id,
				timezone,
				image,
			};
		};

		const ids = await moonMoonzRewarder.depositsOf(addr);
		const tokens = await Promise.all(ids.map(fetchToken));

		return tokens;
	} catch (error) {
		console.error(error);
		return [];
	}
}
