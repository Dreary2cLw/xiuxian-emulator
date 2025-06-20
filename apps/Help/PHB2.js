//插件加载
import plugin from '../../../../lib/plugins/plugin.js';
import fs from 'fs';
import {
	existplayer,
	ForwardMsg,
	Read_player,
	sortBy,
} from '../Xiuxian/xiuxian.js';
import Show from "../../model/show.js";
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';


/**
 * 所有榜单
 */

export class PHB2 extends plugin {
	constructor() {
		super({
			name: 'Yunzai_Bot_TopList',
			dsc: '修仙模块',
			event: 'message',
			priority: 600,
			rule: [
				{
					reg: '^#镇妖塔榜$',
					fnc: 'TOP_Immortal',
				},
				{
					reg: '^#神魄榜$',
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
			//(攻击+防御*0.8+生命*0.5)*暴击率=理论战力
			let player = await Read_player(player_id);
			//计算并保存到数组
			let power = player.镇妖塔层数;
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
		if (temp.length > 20) {
			//只要十个
			length = 20;
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
					'\n镇妖塔层数：' +
					temp[j].power +
					'\nQQ:' +
					temp[j].qq
			);
		}
		//await ForwardMsg(e, msg);
		let img = await get_zhenyaobang_img(e,msg);
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
			let power = player.神魄段数;
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
		if (temp.length > 20) {
			//只要十个
			length = 20;
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
					'\n神魄段数：' +
					temp[j].power +
					'\nQQ:' +
					temp[j].qq
			);
		}
		//await ForwardMsg(e, msg);
		let img = await get_shenpobang_img(e,msg);
		e.reply(img);
		return;
	}
}
export async  function get_zhenyaobang_img(e, msg) {
	let usr_qq = e.user_id;
	let pk_data = {
		user_id: usr_qq,
		Exchange_list: msg,
	};
	const data1 = await new Show(e).get_zhenyaobang(pk_data);
	let img = await puppeteer.screenshot('supermarket', {
		...data1,
	});
	return img;
}
export async  function get_shenpobang_img(e, msg) {
	let usr_qq = e.user_id;
	let pk_data = {
		user_id: usr_qq,
		Exchange_list: msg,
	};
	const data1 = await new Show(e).get_shenpobangData(pk_data);
	let img = await puppeteer.screenshot('supermarket', {
		...data1,
	});
	return img;
}