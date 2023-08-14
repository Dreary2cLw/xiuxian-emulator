import plugin from '../../../../lib/plugins/plugin.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import Help from '../../model/help.js';
import Help1 from '../../model/xunbaohelp.js';
import Help2 from '../../model/shituhelp.js';
import md5 from 'md5';
import {existplayer, Read_player} from "../Xiuxian/xiuxian";
import {
	Add_血气,Add_修为
} from '../Xiuxian/xiuxian.js';

let helpData = {
	md5: '',
	img: '',
};

/**
 * 修仙帮助模块
 */

export class BotHelp extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'BotHelp',
			/** 功能描述 */
			dsc: '修仙帮助',
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 400,
			rule: [
				{
					reg: '^#修仙帮助$',
					fnc: 'Xiuxianhelp',
				},
				{
					reg: '^#修仙管理$',
					fnc: 'adminsuper',
				},
				{
					reg: '^#宗门管理$',
					fnc: 'AssociationAdmin',
				},
				{
					reg: '^#修仙扩展$',
					fnc: 'Xiuxianhelpcopy',
				},
				{
					reg: '^#寻宝帮助$',
					fnc: 'xunbaohelp',
				},
				{
					reg: '^#师徒帮助$',
					fnc: 'shituhelp',
				},
				{
					reg: '^#血气置换$',
					fnc: 'xueqichange',
				}
			],
		});
	}

	async xunbaohelp(e) {
		if (!e.isGroup) {
			return;
		}
		let data = await Help1.xunbaohelp(e);
		if (!data) return;
		let img = await this.cache(data);
		await e.reply(img);
	}

	async Xiuxianhelpcopy(e) {
		if (!e.isGroup) {
			return;
		}
		let data = await Help.gethelpcopy(e);
		if (!data) return;
		let img = await this.cache(data);
		await e.reply(img);
	}

	/**
	 * rule - 修仙帮助
	 * @returns
	 */
	async Xiuxianhelp(e) {
		if (!e.isGroup) {
			return;
		}
		let data = await Help.get(e);
		if (!data) return;
		let img = await this.cache(data);
		await e.reply(img);
	}

	async adminsuper(e) {
		if (!e.isGroup) {
			return;
		}
		let data = await Help.setup(e);
		if (!data) return;
		let img = await this.cache(data);
		await e.reply(img);
	}

	async AssociationAdmin(e) {
		if (!e.isGroup) {
			return;
		}
		let data = await Help.Association(e);
		if (!data) return;
		let img = await this.cache(data);
		await e.reply(img);
	}

	async shituhelp(e) {
		if (!e.isGroup) {
			return;
		}
		let data = await Help2.shituhelp(e);
		if (!data) return;
		let img = await this.cache(data);
		await e.reply(img);
	}

	async xueqichange(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		//获取游戏状态
		let game_action = await redis.get('xiuxian:player:' + usr_qq + ':game_action');
		//防止继续其他娱乐行为
		if (game_action == 0) {
			e.reply('修仙：游戏进行中...');
			return;
		}
		//查询redis中的人物动作
		let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
		action = JSON.parse(action);
		if (action != null) {
			//人物有动作查询动作结束时间
			let action_end_time = action.end_time;
			let now_time = new Date().getTime();
			if (now_time <= action_end_time) {
				let m = parseInt((action_end_time - now_time) / 1000 / 60);
				let s = parseInt((action_end_time - now_time - m * 60 * 1000) / 1000);
				e.reply('正在' + action.action + '中,剩余时间:' + m + '分' + s + '秒');
				return;
			}
		}
		let A_player = await Read_player(usr_qq);
		if(A_player.Physique_id != 54){
			e.reply('只有炼体境界一介凡体可置换！')
			return;
		}
		let xieqi = A_player.血气;
		if(xieqi<900000000){
			e.reply('血气大于900000000才可置换！')
			return;
		}
		await Add_血气(usr_qq, -xieqi);
		await Add_修为(usr_qq, Math.floor(xieqi*0.8));
		return;
	}
	async cache(data) {
		let tmp = md5(JSON.stringify(data));
		if (helpData.md5 == tmp) return helpData.img;
		helpData.img = await puppeteer.screenshot('help', data);
		helpData.md5 = tmp;
		return helpData.img;
	}
}
