import plugin from '../../../../lib/plugins/plugin.js';
import common from '../../../../lib/common/common.js';
import data from '../../model/XiuxianData.js';
import config from '../../model/Config.js';
import fs from 'node:fs';
import {
	Add_najie_thing,
	Add_修为,
	Add_血气,
	exist_najie_thing,
	isNotNull,
} from '../Xiuxian/xiuxian.js';

/**
 * 定时任务
 */
export class PlayerControlTask extends plugin {
	constructor() {
		super({
			name: 'PlayerControlTask',
			dsc: '定时任务',
			event: 'message',
			priority: 300,
			rule: [],
		});
		this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
		this.set = config.getdefSet('task', 'task');
		this.task = {
			cron: this.set.action_task,
			name: 'PlayerControlTask',
			fnc: () => this.Playercontroltask(),
		};
	}

	async Playercontroltask() {
		//获取缓存中人物列表
		let playerList = [];
		let files = fs
			.readdirSync('./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player')
			.filter((file) => file.endsWith('.json'));
		for (let file of files) {
			file = file.replace('.json', '');
			playerList.push(file);
		}
		for (let player_id of playerList) {
			let log_mag = ''; //查询当前人物动作日志信息
			log_mag = log_mag + '查询' + player_id + '是否有动作,';
			//得到动作
			let action = await redis.get('xiuxian:player:' + player_id + ':action');
			action = JSON.parse(action);
			//不为空，存在动作
			if (action != null) {
				let push_address; //消息推送地址
				let is_group = false; //是否推送到群
				if (action.hasOwnProperty('group_id')) {
					if (isNotNull(action.group_id)) {
						is_group = true;
						push_address = action.group_id;
					}
				}
				//最后发送的消息
				let msg = [];
				//动作结束时间
				let end_time = action.end_time;
				//现在的时间
				let now_time = new Date().getTime();
				//闭关状态
				if (action.shutup == '0') {
					//这里改一改,要在结束时间的前一分钟提前结算
					//时间过了
					end_time = end_time - 60000 * 2;
					if (now_time > end_time) {
						log_mag += '当前人物未结算，结算状态';
						let player = data.getData('player', player_id);
						let now_level_id;
						if (!isNotNull(player.level_id)) {
							return;
						}
						now_level_id = data.Level_list.find(
							(item) => item.level_id == player.level_id
						).level_id;
						let size = this.xiuxianConfigData.biguan.size;
						let xiuwei = parseInt(size * now_level_id * (player.修炼效率提升 + 1)); //增加的修为
						let blood = parseInt(player.血量上限 * 0.02);
						let time = parseInt(action.time) / 1000 / 60; //分钟
						let rand = Math.random();
						let xueqi = 0;
						let other_xiuwei = 0;
						//炼丹师丹药修正
						let transformation = '修为';
						let action3 = await redis.get('xiuxian:player:' + 10 + ':biguang');
						action3 = await JSON.parse(action3);
						for (let i = 0; i < action3.length; i++) {
							if (action3[i].qq == player_id) {
								if (action3[i].biguan > 0) {
									action3[i].biguan--;
									if (action3[i].biguan == 0) {
										action3[i].biguanxl = 0;
									}
								}
								if (action3[i].lianti > 0) {
									transformation = '血气';
									action3[i].lianti--;
								}

								if (rand < 0.2) {
									rand = Math.trunc(rand * 10) + 45;
									other_xiuwei = rand * time;
									xueqi = Math.trunc(rand * time * action3[i].beiyong4);
									if (transformation == '血气') {
										msg.push('\n本次闭关顿悟,受到炼神之力修正,额外增加血气:' + xueqi);
									} else {
										msg.push('\n本次闭关顿悟,额外增加修为:' + rand * time);
									}
								} else if (rand > 0.8) {
									rand = Math.trunc(rand * 10) + 5;
									other_xiuwei = -1 * rand * time;
									xueqi = Math.trunc(rand * time * action3[i].beiyong4);
									if (transformation == '血气') {
										msg.push(
											'\n,由于你闭关时隔壁装修,导致你差点走火入魔,受到炼神之力修正,血气下降' + xueqi
										);
									} else {
										msg.push('\n由于你闭关时隔壁装修,导致你差点走火入魔,修为下降' + rand * time);
									}
								}
								let other_x = 0;
								let qixue = 0;
								if (
									(await exist_najie_thing(player_id, '魔界秘宝', '道具')) &&
									player.魔道值 > 999
								) {
									other_x += Math.trunc(xiuwei * 0.15 * time);
									await Add_najie_thing(player_id, '魔界秘宝', '道具', -1);
									msg.push('\n消耗了道具[魔界秘宝],额外增加' + other_x + '修为');
									await Add_修为(player_id, other_x);
								}
								if (
									(await exist_najie_thing(player_id, '神界秘宝', '道具')) &&
									player.魔道值 < 1 &&
									(player.灵根.type == '转生' || player.level_id > 41)
								) {
									qixue = Math.trunc(xiuwei * 0.1 * time);
									await Add_najie_thing(player_id, '神界秘宝', '道具', -1);
									msg.push('\n消耗了道具[神界秘宝],额外增加' + qixue + '血气');
									await Add_血气(player_id, qixue);
								}

								await this.setFileValue(player_id, blood * time, '当前血量');

								if (action.acount == null) {
									action.acount = 0;
								}
								let arr = action;
								//把状态都关了
								arr.shutup = 1; //闭关状态
								arr.working = 1; //降妖状态
								arr.power_up = 1; //渡劫状态
								arr.Place_action = 1; //秘境
								arr.Place_actionplus = 1; //沉迷状态
								delete arr.group_id; //结算完去除group_id
								await redis.set('xiuxian:player:' + player_id + ':action', JSON.stringify(arr));
								xueqi = Math.trunc(xiuwei * time * action3[i].beiyong4);
								if (transformation == '血气') {
									await this.setFileValue(
										player_id,
										(xiuwei * time + other_xiuwei) * action3[i].beiyong4,
										transformation
									);
									msg.push('\n受到炼神之力的影响,增加气血:' + xueqi, '血量增加:' + blood * time);
								} else {
									await this.setFileValue(
										player_id,
										xiuwei * time + other_xiuwei,
										transformation
									);
									msg.push('\n增加修为:' + xiuwei * time, '血量增加:' + blood * time);
								}
								await redis.set('xiuxian:player:' + player_id + ':action', JSON.stringify(arr));
								if (is_group) {
									await this.pushInfo(push_address, is_group, msg);
								} else {
									await this.pushInfo(player_id, is_group, msg);
								}

								if (action3[i].lianti <= 0) {
									action3[i].lianti = 0;
									action3[i].beiyong4 = 0;
								}
								await redis.set('xiuxian:player:' + 10 + ':biguang', JSON.stringify(action3));
							}
						}
					}
				} //炼丹师修正结束
				//降妖
				if (action.working == '0') {
					//这里改一改,要在结束时间的前一分钟提前结算
					end_time = end_time - 60000 * 2;
					//时间过了
					if (now_time > end_time) {
						//现在大于结算时间，即为结算
						log_mag = log_mag + '当前人物未结算，结算状态';
						let player = data.getData('player', player_id);
						let now_level_id;
						if (!isNotNull(player.level_id)) {
							return;
						}
						now_level_id = data.Level_list.find(
							(item) => item.level_id == player.level_id
						).level_id;
						let size = this.xiuxianConfigData.work.size;
						let lingshi = size * now_level_id;
						let time = (parseInt(action.time) / 1000 / 60) * 2; //分钟
						let other_lingshi = 0;
						let other_xueqi = 0;
						let rand = Math.random();
						if (rand < 0.2) {
							rand = Math.trunc(rand * 10) + 40;
							other_lingshi = rand * time;
							msg.push(
								'\n降妖路上途径金银坊，一时手痒入场一掷：6 6 6，额外获得灵石' + rand * time
							);
						} else if (rand > 0.8) {
							rand = Math.trunc(rand * 10) + 5;
							other_lingshi = -1 * rand * time;
							msg.push(
								'\n途径盗宝团营地，由于你的疏忽,货物被人顺手牵羊,老板大发雷霆,灵石减少' +
									rand * time
							);
						} else if (rand > 0.5 && rand < 0.6) {
							rand = Math.trunc(rand * 10) + 20;
							other_lingshi = -1 * rand * time;
							other_xueqi = -2 * rand * time;
							msg.push(
								'\n归来途中经过怡红院，你抵挡不住诱惑，进去大肆消费了' +
									rand * time +
									'灵石，' +
									'早上醒来，气血消耗了' +
									2 * rand * time
							);
						}
						//
						player.血气 += other_xueqi;
						await data.setData('player', player_id, player);
						let get_lingshi = lingshi * time + other_lingshi; //最后获取到的灵石
						//
						await this.setFileValue(player_id, get_lingshi, '灵石'); //添加灵石
						//redis动作
						if (action.acount == null) {
							action.acount = 0;
						}
						let arr = action;
						//把状态都关了
						arr.shutup = 1; //闭关状态
						arr.working = 1; //降妖状态
						arr.power_up = 1; //渡劫状态
						arr.Place_action = 1; //秘境
						arr.Place_actionplus = 1; //沉迷状态
						delete arr.group_id; //结算完去除group_id
						await redis.set('xiuxian:player:' + player_id + ':action', JSON.stringify(arr));
						msg.push('\n降妖得到' + get_lingshi + '灵石');
						log_mag += '收入' + get_lingshi;
						if (is_group) {
							await this.pushInfo(push_address, is_group, msg);
						} else {
							await this.pushInfo(player_id, is_group, msg);
						}
					}
				}
			}
		}
	}

	/**
	 * 增加player文件某属性的值（在原本的基础上增加）
	 * @param user_qq
	 * @param num 属性的value
	 * @param type 修改的属性
	 * @returns {Promise<void>}
	 */
	async setFileValue(user_qq, num, type) {
		let user_data = data.getData('player', user_qq);
		let current_num = user_data[type]; //当前灵石数量
		let new_num = current_num + num;
		if (type == '当前血量' && new_num > user_data.血量上限) {
			new_num = user_data.血量上限; //治疗血量需要判读上限
		}
		user_data[type] = new_num;
		await data.setData('player', user_qq, user_data);
		return;
	}

	/**
	 * 推送消息，群消息推送群，或者推送私人
	 * @param id
	 * @param is_group
	 * @returns {Promise<void>}
	 */
	async pushInfo(id, is_group, msg) {
		if (is_group) {
			await Bot.pickGroup(id)
				.sendMsg(msg)
				.catch((err) => {
					Bot.logger.mark(err);
				});
		} else {
			await common.relpyPrivate(id, msg);
		}
	}
}
