import plugin from '../../../../lib/plugins/plugin.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import Help from '../../model/help.js';
import Help1 from '../../model/xunbaohelp.js';
import Help2 from '../../model/shituhelp.js';
import md5 from 'md5';
import {
	Add_血气,
	Add_修为,
	existplayer,
	Read_player,
	sleep
} from '../Xiuxian/xiuxian.js';
import data from '../../model/XiuxianData.js';


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
				},
				{
					reg: '^#状态校验$',
					fnc: 'statuscheckout',
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
		e.reply('置换成功！')
		return;
	}
	async statuscheckout(e) {
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

		let A_player = await Read_player(usr_qq);
		let actioncheck = await this.getPlayerAction(usr_qq);
		let status = '空闲';
		if (actioncheck.time != null) {
			status = actioncheck.action + '(剩余时间:' + actioncheck.time + ')';
		}
		e.reply(actioncheck.cishu +"state:"+status);
		if(usr_qq == 8139893750449888096 || usr_qq == 9536826149557637141){
			status = '空闲';
		}
		if (status == '空闲'&&actioncheck.cishu>0) {
			let weizhi = actioncheck.Place_address;
			let jindi = 0;
			let weizhimsg = await data.didian_list.find((item) => item.name == weizhi.name);
			if(weizhimsg == null){
				weizhimsg = await data.forbiddenarea_list.find((item) => item.name == weizhi.name);
				jindi = 1;
			}
			if(weizhimsg == null){
				weizhimsg = await data.guildSecrets_list.find((item) => item.name == weizhi.name);
			}
			if(actioncheck.cishu<3){
				e.reply("当前秘境次数："+actioncheck.cishu+",偏差较低不做处理");
				return;
			}else{
				e.reply("状态校验失败，正在计算补偿，请稍等....");
				await sleep(2000);
				e.reply("秘境："+weizhi.name+"，门票："+weizhimsg.Price+"，偏差次数："+actioncheck.cishu+"\n"+
					"补偿灵石："+actioncheck.cishu*weizhimsg.Price+"，补偿修为："+actioncheck.cishu*weizhimsg.Price*jindi);
			}

		}else{
			e.reply("状态校验成功，状态正常！");
			return;
		}
		return;
	}
	async cache(data) {
		let tmp = md5(JSON.stringify(data));
		if (helpData.md5 == tmp) return helpData.img;
		helpData.img = await puppeteer.screenshot('help', data);
		helpData.md5 = tmp;
		return helpData.img;
	}

	/**
	 * 获取缓存中的人物状态信息
	 * @param usr_qq
	 * @returns {Promise<void>}
	 */
	async getPlayerAction(usr_qq) {
		let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
		action = JSON.parse(action); //转为json格式数据
		return action;
	}

	/**
	 * 获取人物的状态，返回具体的状态或者空闲
	 * @param action
	 * @returns {Promise<void>}
	 */
	async getPlayerState(action) {
		if (action == null) {
			return '空闲';
		}
		let now_time = new Date().getTime();
		let end_time = action.end_time;
		//当前时间>=结束时间，并且未结算 属于已经完成任务，却并没有结算的
		//当前时间<=完成时间，并且未结算 属于正在进行
		if (
			!(
				(now_time >= end_time &&
					(action.shutup == 0 ||
						action.working == 0 ||
						action.plant == 0 ||
						action.min == 0)) ||
				(now_time <= end_time &&
					(action.shutup == 0 ||
						action.working == 0 ||
						action.plant == 0 ||
						action.mine == 0 ||
						action.shoulie == 0))
			)
		) {
			return '空闲';
		}
		return action.action;
	}
}
