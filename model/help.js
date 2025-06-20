import base from './base.js';
import xiuxianCfg from './Config.js';

export default class Help extends base {
	constructor(e) {
		super(e);
		this.model = 'help';
	}

	static async get(e) {
		let html = new Help(e);
		return await html.getData();
	}

	static async gethelpcopy(e) {
		let html = new Help(e);
		return await html.getDatahelpcopy();
	}

	static async setup(e) {
		let html = new Help(e);
		return await html.Getset();
	}

	static async Association(e) {
		let html = new Help(e);
		return await html.GetAssociationt();
	}

	async getDatahelpcopy() {
		let helpData = xiuxianCfg.getdefSet('help', 'helpcopy');
		let versionData = xiuxianCfg.getdefSet('version', 'version');
		const version =
			(versionData && versionData.length && versionData[0].version) || '1.0.4';
		const version_name =
			(versionData && versionData.length && versionData[0].name) || '1.0.4';
		return {
			...this.screenData,
			saveId: 'help',
			version: version,
			version_name: version_name,
			helpData,
		};
	}

	async getData() {
		let helpData = xiuxianCfg.getdefSet('help', 'help');

		let versionData = xiuxianCfg.getdefSet('version', 'version');
		const version =
			(versionData && versionData.length && versionData[0].version) || '1.0.4';
		const version_name =
			(versionData && versionData.length && versionData[0].name) || '1.0.4';
		return {
			...this.screenData,
			saveId: 'help',
			version: version,
			version_name: version_name,
			helpData,
		};
	}

	async Getset() {
		let helpData = xiuxianCfg.getdefSet('help', 'set');
		let versionData = xiuxianCfg.getdefSet('version', 'version');
		const version =
			(versionData && versionData.length && versionData[0].version) || '1.0.4';
		const version_name =
			(versionData && versionData.length && versionData[0].name) || '1.0.4';
		return {
			...this.screenData,
			saveId: 'help',
			version: version,
			version_name: version_name,
			helpData,
		};
	}

	async GetAssociationt() {
		let helpData = xiuxianCfg.getdefSet('help', 'Association');
		let versionData = xiuxianCfg.getdefSet('version', 'version');
		const version =
			(versionData && versionData.length && versionData[0].version) || '1.0.4';
		const version_name =
			(versionData && versionData.length && versionData[0].name) || '1.0.4';
		return {
			...this.screenData,
			saveId: 'help',
			version: version,
			version_name: version_name,
			helpData,
		};
	}
}
