import plugin from '../../../../lib/plugins/plugin.js';
import config from '../../model/Config.js';
import fs from 'fs';
import {
	__PATH,
	Read_player,
	existplayer,
	sleep,
	add_renwu,
	Write_renwu,
	Read_renwu,
	fstadd_renwu,
	find_renwu,
	shijianc,
	Add_灵石,
	Add_修为,
	Add_血气,
	Add_najie_thing,
} from '../Xiuxian/xiuxian.js';
import Show from '../../model/show.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import data from '../../model/XiuxianData.js';

let allaction = false; //全局状态判断

/**
 * 作者：晓飞
 */

export class meirrenwu extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'meirrenwu',
			/** 功能描述 */
			dsc: '任务模块',
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 600,
			rule: [
				{
					reg: '^#接取每日任务$',
					fnc: 'zuolao',
				},
				{
					reg: '^#我的任务$',
					fnc: 'look_renwu',
				},
				{
					reg: '^#提交每日任务$',
					fnc: 'zuowanle',
				},
				{
					reg: '^#领取每日奖励$',
					fnc: 'xingchen',
				},
			],
		});
		this.set = config.getdefSet('task', 'task');
		this.task = {
			cron: this.set.ExchangeTask,
			name: 'renwutask',
			fnc: () => this.renwutask(),
		};
	}
	/**
	 * 接取每日任务
	 */
	async zuolao(e) {
		let usr_qq = e.user_id;
		let player = await Read_player(usr_qq);
		let A = e.user_id;
		let user_A = A;
		let renwu = await Read_renwu();
		let i = await found(user_A);
		let chazhao = await find_renwu(A);
		let lingshi = player.灵石;
		// let arr = [];
		// let Random
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		//有无账号
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let now = new Date();
		let nowTime = now.getTime(); //获取当前日期的时间戳
		let Today = await shijianc(nowTime);
		let lastrenwu_time = await redis.get(
			'xiuxian:player:' + usr_qq + ':last_renwu_time'
		); //获得上次接取任务日期,
		lastrenwu_time = parseInt(lastrenwu_time);
		lastrenwu_time = await shijianc(lastrenwu_time);
		if (
			Today.Y == lastrenwu_time.Y &&
			Today.M == lastrenwu_time.M &&
			Today.D == lastrenwu_time.D
		) {
			e.reply(`今日已经接取过任务了`);
			return;
		}
		//查看有没有存档
		if (chazhao == 0) {
			await add_renwu(A, 1);
			e.reply(
				'由于这是你第一次接取每日任务，已为你建立存档，请再次发送"#接取每日任务"'
			);
			return;
		}
		renwu[i].wancheng1 = 1;
		renwu[i].wancheng2 = 1;
		renwu[i].wancheng3 = 1;
		renwu[i].renwu = 0;
		renwu[i].jilu1 = 0;
		renwu[i].jilu2 = 0;
		renwu[i].jilu3 = 0;
		await Write_renwu(renwu);
		await redis.set('xiuxian:player:' + usr_qq + ':last_renwu_time', nowTime); //redis设置签到时间
		await redis.set('xiuxian:player:' + usr_qq + ':renwu_lingshi_jilu', lingshi);
		e.reply('今日任务成功接取');
		return;
		// //创造一个在1-9范围内的3个随机数
		// for (let i = 0; i < 3; i++) {
		//   getLuckyNum();
		// }
		// function getLuckyNum() {
		//   do {
		//     Random = Math.floor(Math.random() * 9) + 1;
		//   } while (arr.indexOf(Random) != -1)
		//   arr.push(Random);
		// }
		// //写入
		// renwu[i].renwu1 = arr[0]
	}
	/**
	 * 提交每日任务
	 */
	async zuowanle(e) {
		let A = e.user_id;
		let user_A = A;
		let renwu = await Read_renwu();
		let i = await found(user_A);
		let m = ``;
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let player = await Read_player(usr_qq);
		let chazhao = await find_renwu(A);
		//有无账号
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		//查看有没有存档
		if (chazhao == 0) {
			await add_renwu(A, 1);
			e.reply(`请先#接取每日任务！`);
			return;
		}
		//查看任务完成状态
		if (
			renwu[i].wancheng1 == 2 &&
			renwu[i].wancheng2 == 2 &&
			renwu[i].wancheng3 == 2
		) {
			return;
		}
		//查看任务接取状态
		if (
			renwu[i].wancheng1 == 0 &&
			renwu[i].wancheng2 == 0 &&
			renwu[i].wancheng3 == 0
		) {
			e.reply(`请先#接取每日任务！`);
			return;
		}
		//这里是查看灵石有无增多or减少，写入任务记录
		let lingshi = player.灵石;
		let lingshijilu = await redis.get(
			'xiuxian:player:' + usr_qq + ':renwu_lingshi_jilu'
		);
		let jian = 0;
		if (
			lingshijilu != lingshi &&
			(renwu[i].wancheng1 == 1 || renwu[i].wancheng2 == 1)
		) {
			if (lingshi < lingshijilu) {
				jian = lingshijilu - lingshi;
				renwu[i].jilu1 += jian;
				await Write_renwu(renwu);
				await redis.set('xiuxian:player:' + usr_qq + ':renwu_lingshi_jilu', lingshi);
			} else if (lingshi > lingshijilu) {
				jian = lingshi - lingshijilu;
				renwu[i].jilu2 += jian;
				await Write_renwu(renwu);
				await redis.set('xiuxian:player:' + usr_qq + ':renwu_lingshi_jilu', lingshi);
			}
		}
		await sleep(2000);
		let dengji = renwu[i].等级;
		//这里是任务提交需要的东西
		//需要消耗：(任务等级*5+player炼气+player练体)*5000个灵石
		let xuyao1 = (dengji * 5 + player.level_id + player.Physique_id) * 20000;
		//需要获得：(任务等级*5+player炼气+player练体)*5000个灵石
		let xuyao2 = (dengji * 5 + player.level_id + player.Physique_id) * 20000;
		//需要进入等级+4次秘境
		let xuyao3 = dengji + 4;
		//这里是奖励
		//看你怎么弄了，反正给的东西是不多的，巨少！(估计狗都嫌弃)
		//这个是获得的灵石，修为，血气
		//计算公式：(任务等级*(player炼气+player练体))*5000
		let jiangli = dengji * (player.level_id + player.Physique_id) * 3000;
		//这个是获得的物品的数量
		//计算公式：任务等级
		let wupin = dengji;
		//这个是任务经验，任务等级越高获得的东西越多，但是这个等级挺难升的，不用改，问题不大
		//(我自己测试是64练气54炼体，也要做上小一周才能升一级，而且越往后越难升)
		//计算公式：((任务等级*5)+player炼气+player练体)*8
		let jingyan = (dengji * 5 + player.level_id + player.Physique_id) * 8;
		//结算任务
		if (renwu[i].jilu1 > xuyao1 - 1) {
			renwu[i].wancheng1 = 2;
			renwu[i].jilu1 = 0;
			await Add_修为(usr_qq, jiangli);
			await Add_血气(usr_qq, jiangli);
			await Add_灵石(usr_qq, jiangli);
			renwu[i].经验 += jingyan;
			m += `你完成了任务1,获得了：\n1.修为*${jiangli}\n2.血气*${jiangli}\n3.灵石*${jiangli}\n4.任务经验*${jingyan}\n`;
		}
		if (renwu[i].jilu2 > xuyao2 - 1) {
			renwu[i].wancheng2 = 2;
			renwu[i].jilu2 = 0;
			await Add_修为(usr_qq, jiangli);
			await Add_血气(usr_qq, jiangli);
			await Add_灵石(usr_qq, jiangli);
			renwu[i].经验 += jingyan;
			m += `你完成了任务2,获得了：\n1.修为*${jiangli}\n2.血气*${jiangli}\n3.灵石*${jiangli}\n4.任务经验*${jingyan}\n`;
		}
		if (renwu[i].jilu3 > xuyao3 - 1) {
			renwu[i].wancheng3 = 2;
			renwu[i].jilu3 = 0;
			await Add_修为(usr_qq, jiangli);
			await Add_血气(usr_qq, jiangli);
			await Add_灵石(usr_qq, jiangli);
			renwu[i].经验 += jingyan;
			m += `你完成了任务3,获得了：\n1.修为*${jiangli}\n2.血气*${jiangli}\n3.灵石*${jiangli}\n4.任务经验*${jingyan}\n`;
		}
		if (
			renwu[i].wancheng1 == 2 &&
			renwu[i].wancheng2 == 2 &&
			renwu[i].wancheng3 == 2
		) {
			renwu[i].renwu = 1;
			m += `你已完成全部每日任务，可以领取奖励了！`;
		}
		await Write_renwu(renwu);
		await sleep(1000);
		//这里是经验升级的地方，你如果要是需要改记得给底下还有俩也改了，一般来说不用改，要的挺多的，等级巨难升
		//计算公式：(任务等级*1000加2333)*5
		let shengji = (dengji * 2200 + 1000) * 10 + 2333;
		if (renwu[i].经验 > shengji - 1) {
			renwu[i].等级++;
			renwu[i].经验 -= shengji;
			await Write_renwu(renwu);
		}
		//最后发送任务完成状态
		if (m != 0) {
			e.reply(m);
			return;
		}
		if (
			renwu[i].wancheng1 != 2 ||
			renwu[i].wancheng2 != 2 ||
			renwu[i].wancheng3 != 2
		) {
			e.reply(`你还有任务没完成哦~`);
			return;
		}
		return;
	}
	/**
	 * 我的任务
	 */

	async look_renwu(e) {
		let A = e.user_id;
		let user_A = A;
		let renwu = await Read_renwu();
		let i = await found(user_A);
		let usr_qq = e.user_id;
		let player = await Read_player(usr_qq);
		let chazhao = await find_renwu(A);
		//这里是查看灵石有无增多or减少，写入任务记录
		let lingshi = player.灵石;
		let lingshijilu = await redis.get(
			'xiuxian:player:' + usr_qq + ':renwu_lingshi_jilu'
		);
		let jian = 0;
		if (
			lingshijilu != lingshi &&
			(renwu[i].wancheng1 == 1 || renwu[i].wancheng2 == 1)
		) {
			if (lingshi < lingshijilu) {
				jian = lingshijilu - lingshi;
				renwu[i].jilu1 += jian;
				await Write_renwu(renwu);
				await redis.set('xiuxian:player:' + usr_qq + ':renwu_lingshi_jilu', lingshi);
			} else if (lingshi > lingshijilu) {
				jian = lingshi - lingshijilu;
				renwu[i].jilu2 += jian;
				await Write_renwu(renwu);
				await redis.set('xiuxian:player:' + usr_qq + ':renwu_lingshi_jilu', lingshi);
			}
		}
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let img = await get_renwu_img(e);
		e.reply(img);
		return;
	}
	async renwutask() {
		let File = fs.readdirSync(__PATH.player_path);
		File = File.filter((file) => file.endsWith('.json'));
		let File_length = File.length;
		fs.rmSync(`${__PATH.renwu}/renwu.json`);
		let temp = [];
		for (var k = 0; k < File_length; k++) {
			let this_qq = File[k].replace('.json', '');
			this_qq = parseInt(this_qq);
			let player = await Read_player(this_qq);
			let A = this_qq;
			let user_A = A;
			let renwu = await Read_renwu();
			let i = await found(user_A);
			temp[k] = {
				player: player.名号,
				等级: renwu[i].等级,
				经验: renwu[i].经验,
				renwu: 0,
				wancheng1: 1,
				jilu1: 0,
				wancheng2: 1,
				jilu2: 0,
				wancheng3: 1,
				jilu3: 0,
				jiequ: [],
			};
			await Write_renwu(renwu);
		}
	}
	/**
	 * 领取每日奖励
	 */
	async xingchen(e) {
		let A = e.user_id;
		let user_A = A;
		let renwu = await Read_renwu();
		let i = await found(user_A);
		let usr_qq = e.user_id;
		let player = await Read_player(usr_qq);
		let dengji = renwu[i].等级;
		//这里是奖励
		//看你怎么弄了，反正给的东西是不多的，巨少！(估计狗都嫌弃)
		//这个是获得的灵石，修为，血气
		//计算公式：(任务等级*(player炼气+player练体))*8000
		let jiangli = dengji * (player.level_id + player.Physique_id) * 8000;
		//这个是获得的物品的数量
		//计算公式：任务等级
		let wupin = dengji;
		//这个是任务经验，任务等级越高获得的东西越多，但是这个等级挺难升的，不用改，问题不大
		//(我自己测试是64练气54炼体，也要做上小一周才能升一级，而且越往后越难升)
		//计算公式：((任务等级*5)+player炼气+player练体)*12
		let jingyan = (dengji * 5 + player.level_id + player.Physique_id) * 12;
		if (
			renwu[i].wancheng1 == 2 &&
			renwu[i].wancheng2 == 2 &&
			renwu[i].wancheng3 == 2 &&
			renwu[i].renwu == 1
		) {
			renwu[i].renwu = 2;
			await Add_修为(usr_qq, jiangli);
			await Add_血气(usr_qq, jiangli);
			await Add_灵石(usr_qq, jiangli);
			await Add_najie_thing(usr_qq, '仙子邀约', '道具', wupin);
			await Add_najie_thing(usr_qq, '秘境之匙', '道具', wupin);
			renwu[i].经验 += jingyan;
			await Write_renwu(renwu);
			e.reply(
				`你领取了每日任务奖励，获得了：\n1.修为*${jiangli}\n2.血气*${jiangli}\n3.灵石*${jiangli}\n4.任务经验*${jingyan}\n5.仙子邀约*${wupin}个\n6.秘境之匙*${wupin}个\n`
			);
		} else if (
			renwu[i].wancheng1 != 2 ||
			renwu[i].wancheng2 != 2 ||
			renwu[i].wancheng3 != 2
		) {
			e.reply(`你还有任务没完成哦~`);
			return;
		} else if (renwu[i].renwu == 2) {
			e.reply(`你已经领取了每日任务奖励了`);
			return;
		}
		await sleep(3000);
		//这里是经验升级的地方，你如果要是需要改记得给底下的显示也改了，一般来说不用改，要的挺多的，等级巨难升
		//计算公式：(任务等级*1000加2333)*5
		let shengji = (dengji * 2200 + 1000) * 10 + 2333;
		if (renwu[i].经验 > shengji - 1) {
			renwu[i].等级 += 1;
			renwu[i].经验 -= shengji;
			await Write_renwu(renwu);
		}
		return;
	}
}
/**
 * 我的任务
 * @return image
 */

export async function get_renwu_img(e) {
	let usr_qq = e.user_id;
	let player = await Read_player(usr_qq);
	let user_A;
	let A = e.user_id;
	user_A = A;
	let renwu11 = await Read_renwu();
	let x = await found(user_A);
	let shifu = await find_renwu(A);
	//无存档
	let ifexistplay = data.existData('player', usr_qq);
	if (!ifexistplay) {
		return;
	}
	//判断对方有没有存档
	if (shifu == 0) {
		e.reply('你还没有收过徒弟');
		return;
	}

	let action = await find_renwu(A);
	if (action == false) {
		await fstadd_renwu(A);
	}
	let newaction = await Read_renwu();
	let i;
	for (i = 0; i < newaction.length; i++) {
		if (newaction[i].player == A) {
			//这里是显示
			let dengji = renwu11[x].等级;
			let xuyao1 = (dengji * 5 + player.level_id + player.Physique_id) * 20000;
			let xuyao2 = (dengji * 5 + player.level_id + player.Physique_id) * 20000;
			let xuyao3 = dengji + 4;
			let ass;
			ass = newaction[i].经验;
			let renwu1 = '当前没有任务';
			let renwu2 = '当前没有任务';
			let renwu3 = '当前没有任务';
			if (renwu11[x].wancheng1 == 1) {
				renwu1 = `消耗${xuyao1}灵石(每次提交任务时才会刷新)`;
			}
			if (renwu11[x].wancheng2 == 1) {
				renwu2 = `获取${xuyao2}灵石(每次提交任务时才会刷新)`;
			}
			if (renwu11[x].wancheng3 == 1) {
				renwu3 = `前往${xuyao3}次秘境(沉迷不计入)`;
			}
			let wc1;
			let wc2;
			let wc3;
			let rw1 = renwu11[x].jilu1;
			let rw2 = renwu11[x].jilu2;
			let rw3 = renwu11[x].jilu3;
			let wcrw1 = xuyao1;
			let wcrw2 = xuyao2;
			let wcrw3 = xuyao3;
			let new1 = newaction[x].等级;
			let shengji = (dengji * 2200 + 1000) * 10 + 2333;
			let need = shengji;
			let need1 = Strand(ass, need);
			let renwu = `还有任务没完成哦~`;
			if (renwu11[x].renwu == 1) {
				renwu = `未领取,输入"#领取每日奖励"领取哦~`;
			} else if (renwu11[x].renwu == 2) {
				renwu = `已领取`;
			}
			if (renwu11[x].wancheng1 == 0) {
				wc1 = '(未接取)';
			} else if (renwu11[x].wancheng1 == 1) {
				wc1 = '(未完成)';
			} else if (renwu11[x].wancheng1 == 2) {
				wc1 = '(已完成)';
			}
			if (renwu11[x].wancheng2 == 0) {
				wc2 = '(未接取)';
			} else if (renwu11[x].wancheng2 == 1) {
				wc2 = '(未完成)';
			} else if (renwu11[x].wancheng2 == 2) {
				wc2 = '(已完成)';
			}
			if (renwu11[x].wancheng3 == 0) {
				wc3 = '(未接取)';
			} else if (renwu11[x].wancheng3 == 1) {
				wc3 = '(未完成)';
			} else if (renwu11[x].wancheng3 == 2) {
				wc3 = '(已完成)';
			}
			let renwu_data = {
				user_id: usr_qq,
				minghao: player.名号,
				jingyan: ass,
				dengji: new1,
				xuyao: need,
				baifenbixuyao: need1,
				rw1: renwu1,
				rw2: renwu2,
				rw3: renwu3,
				wancheng1: wc1,
				wancheng2: wc2,
				wancheng3: wc3,
				zhuangtai: renwu,
				wc1: rw1,
				wc2: rw2,
				wc3: rw3,
				xuyao1: wcrw1,
				xuyao2: wcrw2,
				xuyao3: wcrw3,
			};
			const data1 = await new Show(e).get_renwuData(renwu_data);
			return await puppeteer.screenshot('renwu', {
				...data1,
			});
		}
	}
}
/**
 * @description: 进度条渲染
 * @param {Number} res 百分比小数
 * @return {*} css样式
 */

async function found(A) {
	let renwu = await Read_renwu();
	let i;
	for (i = 0; i < renwu.length; i++) {
		if (renwu[i].player == A) {
			break;
		}
	}
	return i;
}

function Strand(now, max) {
	let num = ((now / max) * 100).toFixed(0);
	let mini;
	if (num > 100) {
		mini = 100;
	} else {
		mini = num;
	}
	let strand = {
		style: `style=width:${mini}%`,
		num: num,
	};
	return strand;
}
