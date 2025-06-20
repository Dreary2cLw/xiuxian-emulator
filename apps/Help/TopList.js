//插件加载
import plugin from '../../../../lib/plugins/plugin.js';
import data from '../../model/XiuxianData.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import fs from 'fs';
import {
	get_ranking_money_img,
	get_ranking_power_img,
} from '../ShowImeg/showData.js';
import {
	__PATH,
	existplayer,
	ForwardMsg,
	Get_xiuwei,
	isNotNull,
	Read_najie,
	Read_player,
	sleep,
	sortBy,
} from '../Xiuxian/xiuxian.js';
import Show from "../../model/show.js";

/**
 * 所有榜单
 */

export class TopList extends plugin {
	constructor() {
		super({
			name: 'Yunzai_Bot_TopList',
			dsc: '修仙模块',
			event: 'message',
			priority: 600,
			rule: [
				{
					reg: '^#天榜$',
					fnc: 'TOP_xiuwei',
				},
				{
					reg: '^#灵榜$',
					fnc: 'TOP_lingshi',
				},
				{
					reg: '^#封神榜$',
					fnc: 'TOP_Immortal',
				},
				{
					reg: '^#至尊榜$',
					fnc: 'TOP_genius',
				},
			],
		});
	}

	//封神榜
	async TOP_Immortal(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let msg = ['___[封神榜]___'];
		let playerList = [];
		//数组
		let temp = [];
		let files = fs
			.readdirSync('./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player')
			.filter((file) => file.endsWith('.json'));
		for (let file of files) {
			file = file.replace('.json', '');
			playerList.push(file);
		}
		let i = 0;
		for (let player_id of playerList) {
			if(player_id == 9536826149557637141||player_id == 8139893750449888096 || player_id == 18236763786415097341){
				continue;
			}
			//(攻击+防御*0.8+生命*0.5)*暴击率=理论战力
			let player = await Read_player(player_id);
			//计算并保存到数组
			let power =
				player.攻击 * 0.9 +
				player.防御 * 1.1 +
				player.血量上限 * 0.6 +
				player.暴击率 * player.攻击 * 0.5;
			if (player.level_id < 42) {
				//跳过凡人
				continue;
			}
			power = Math.trunc(power);
			temp[i] = {
				power: power,
				qq: player_id,
				name: player.名号,
				level_id: player.level_id,
			};
			i++;
		}
		//根据力量排序
		temp.sort(sortBy('power'));
		console.log(temp);
		let length;
		if (temp.length > 10) {
			//只要十个
			length = 10;
		} else {
			length = temp.length;
		}
		let j;
		for (j = 0; j < length; j++) {
			msg.push(
				'第' +
					(j + 1) +
					'名' +
					'\n道号：' +
					temp[j].name +
					'\n战力：' +
					temp[j].power +
					'\nQQ:' +
					temp[j].qq
			);
		}
		//await ForwardMsg(e, msg);
		let img = await get_fengshen_img(e,msg);
		e.reply(img);
		return;
	}

	//#至尊榜
	async TOP_genius(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let msg = [];
		let playerList = [];
		//数组
		let temp = [];
		let files = fs
			.readdirSync('./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player')
			.filter((file) => file.endsWith('.json'));
		for (let file of files) {
			file = file.replace('.json', '');
			playerList.push(file);
		}
		let i = 0;
		for (let player_id of playerList) {
			if(player_id == 9536826149557637141||player_id == 8139893750449888096 || player_id == 18236763786415097341){
				continue;
			}
			//(攻击+防御+生命*0.5)*暴击率=理论战力
			let player = await Read_player(player_id);
			//计算并保存到数组
			let power =
				(player.攻击 + player.防御 * 0.8 + player.血量上限 * 0.6) * (player.暴击率 + 1);
			if (player.level_id >= 42) {
				//跳过仙人的记录
				continue;
			}
			power = Math.trunc(power);
			temp[i] = {
				power: power,
				qq: player_id,
				name: player.名号,
				level_id: player.level_id,
			};
			i++;
		}
		//根据力量排序
		temp.sort(sortBy('power'));
		console.log(temp);
		let length;
		if (temp.length > 10) {
			//只要十个
			length = 10;
		} else {
			length = temp.length;
		}
		let j;
		for (j = 0; j < length; j++) {
			msg.push(
				'第' +
					(j + 1) +
					'名' +
					'\n道号：' +
					temp[j].name +
					'\n战力：' +
					temp[j].power +
					'\nQQ:' +
					temp[j].qq
			);
		}
		//await ForwardMsg(e, msg);
		let img = await get_zhizun_img(e,msg);
		e.reply(img);
		return;
	}

	async TOP_xiuwei(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}

		let usr_paiming;
		let File = fs.readdirSync(__PATH.player_path);
		File = File.filter((file) => file.endsWith('.json'));
		console.log(File);
		let File_length = File.length;
		let temp = [];
		for (let i = 0; i < File_length; i++) {
			let this_qq = File[i].replace('.json', '');
			if(this_qq == 9536826149557637141||this_qq == 8139893750449888096 || this_qq == 18236763786415097341){
				continue;
			}
			let player = await Read_player(this_qq);
			let sum_exp = await Get_xiuwei(this_qq);
			if (!isNotNull(player.level_id)) {
				e.reply('请先#一键同步');
				return;
			}
			//境界名字需要查找境界名
			let level = data.Level_list.find(
				(item) => item.level_id == player.level_id
			).level;
			temp[i] = {
				总修为: sum_exp,
				境界: level,
				名号: player.名号,
				qq: this_qq,
			};
		}
		//排序
		temp.sort(sortBy('总修为'));
		usr_paiming = temp.findIndex((temp) => temp.qq === usr_qq) + 1;
		let Data = [];
		if (File_length > 10) {
			File_length = 10;
		} //最多显示前十
		for (let i = 0; i < File_length; i++) {
			temp[i].名次 = i + 1;
			Data[i] = temp[i];
		}
		let thisplayer = await data.getData('player', usr_qq);
		let img = await get_ranking_power_img(e, Data, usr_paiming, thisplayer);
		e.reply(img);
		return;
	}

	//TOP_lingshi
	async TOP_lingshi(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let usr_paiming;
		let File = fs.readdirSync(__PATH.player_path);
		File = File.filter((file) => file.endsWith('.json'));
		let File_length = File.length;
		let temp = [];
		for (let i = 0; i < File_length; i++) {
			let this_qq = File[i].replace('.json', '');
			if(this_qq == 9536826149557637141||this_qq == 8139893750449888096 || this_qq == 18236763786415097341){
				continue;
			}
			let player = await Read_player(this_qq);
			let najie = await Read_najie(this_qq);
			let lingshi = player.灵石 + najie.灵石;
			temp[i] = {
				ls1: najie.灵石,
				ls2: player.灵石,
				灵石: lingshi,
				名号: player.名号,
				qq: this_qq,
			};
		}
		//排序
		temp.sort(sortBy('灵石'));
		let Data = [];
		usr_paiming = temp.findIndex((temp) => temp.qq === usr_qq) + 1;
		if (File_length > 10) {
			File_length = 10;
		} //最多显示前十
		for (let i = 0; i < File_length; i++) {
			temp[i].名次 = i + 1;
			Data[i] = temp[i];
		}
		await sleep(500);
		let thisplayer = await data.getData('player', usr_qq);
		let thisnajie = await data.getData('najie', usr_qq);
		let img = await get_ranking_money_img(
			e,
			Data,
			usr_paiming,
			thisplayer,
			thisnajie
		);
		e.reply(img);
		return;
	}
}
export async  function get_fengshen_img(e, msg) {
	let usr_qq = e.user_id;
	let pk_data = {
		user_id: usr_qq,
		Exchange_list: msg,
	};
	const data1 = await new Show(e).get_fengshenData(pk_data);
	let img = await puppeteer.screenshot('supermarket', {
		...data1,
	});
	return img;
}
export async  function get_zhizun_img(e, msg) {
	let usr_qq = e.user_id;
	let pk_data = {
		user_id: usr_qq,
		Exchange_list: msg,
	};
	const data1 = await new Show(e).get_zhizunData(pk_data);
	let img = await puppeteer.screenshot('supermarket', {
		...data1,
	});
	return img;
}