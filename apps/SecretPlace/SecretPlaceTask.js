import plugin from '../../../../lib/plugins/plugin.js';
import common from '../../../../lib/common/common.js';
import config from '../../model/Config.js';
import data from '../../model/XiuxianData.js';
import fs from 'node:fs';
import {
	Add_HP,
	Add_najie_thing,
	Add_修为,
	Add_血气,
	Add_灵石,
	get_random_talent,
	Read_equipment,
	isNotNull,
	Read_player,exist_najie_thing,
	get_log_img,
} from '../Xiuxian/xiuxian.js';
import { mjzd_battle } from '../Battle/Battle.js';

/**
 * 定时任务
 */
export class SecretPlaceTask extends plugin {
	constructor() {
		super({
			name: 'SecretPlaceTask',
			dsc: '定时任务',
			event: 'message',
			priority: 300,
			rule: [],
		});
		this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
		this.set = config.getdefSet('task', 'task');
		this.task = {
			cron: this.set.action_task,
			name: 'SecretPlaceTask',
			fnc: () => this.Secretplacetask(),
		};
	}

	async Secretplacetask() {
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
					
			action = await JSON.parse(action);
			//console.log('--'+action.group_id);
			//不为空，存在动作
			if (action != null) {
				let push_address; //消息推送地址
				let is_group = false; //是否推送到群
				if (await action.hasOwnProperty('group_id')) {
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
				//用户信息
				let player = await Read_player(player_id);
				//有秘境状态:这个直接结算即可
				if (action.Place_action == '0') {
					//这里改一改,要在结束时间的前两分钟提前结算
					end_time = end_time - 60000 * 2;
					//时间过了
					if (now_time > end_time) {
						let weizhi = action.Place_address;
						let xf = -1;
						if (weizhi.name == '高级' || weizhi.name == '中级' || weizhi.name == '低级') {
							xf = action.XF;
						}
						if (player.灵根 == null || player.灵根 == undefined) {
							player.灵根 = await get_random_talent();
							player.修炼效率提升 += player.灵根.eff;
						}
						data.setData('player', player_id, player);
						let A_player = {
							名号: player.名号,
							攻击: player.攻击,
							防御: player.防御,
							当前血量: player.当前血量,
							暴击率: player.暴击率,
							法球倍率: player.灵根.法球倍率,
							职业: player.occupation,
						};
						let monster_length = data.monster_list.length;
						let monster_index = Math.trunc(Math.random() * monster_length);
						let monster = data.monster_list[monster_index];
						if (
							weizhi.name == '三清山' ||
							weizhi.name == '张家界' ||
							weizhi.name == '九寨沟' ||
							weizhi.name == '啵唧的小金库' ||
							(weizhi.name == '低级' && xf == 0)
						) {
							monster_length = data.monster_list1.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list1[monster_index];
						}
						if (
							weizhi.name == '青城山' ||
							weizhi.name == '武当山' ||
							weizhi.name == '龙虎山' ||
							(weizhi.name == '中级' && xf == 0) ||
							weizhi.name == '职场'
						) {
							monster_length = data.monster_list2.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list2[monster_index];
						}
						if (
							weizhi.name == '试炼' ||
							weizhi.name == '华山' ||
							weizhi.name == '衡山' ||
							weizhi.name == '嵩山' ||
							(weizhi.name == '高级' && xf == 0) ||
							weizhi.name == '轮回池'
						) {
							monster_length = data.monster_list3.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list3[monster_index];
						}
						if (
							weizhi.name == '神兽试炼' ||
							weizhi.name == '灭仙洞' ||
							weizhi.name == '禁忌海' ||
							weizhi.name == '雷风岛' ||
							weizhi.name == '仙遗之地' ||
							weizhi.name == '无欲天仙' ||
							weizhi.name == '须弥'
						) {
							monster_length = data.monster_list4.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list4[monster_index];
						}
						if (
							weizhi.name == '剑冢' ||
							weizhi.name == '影界' ||
							weizhi.name == '剑帝传承'
						) {
							monster_length = data.monster_list5.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list5[monster_index];
						}
						if (
							weizhi.name == '蓬莱岛' ||
							weizhi.name == '昆仑山' ||
							weizhi.name == '方诸山' ||
							weizhi.name == '杀神崖' ||
							weizhi.name == '斩魔谷' ||
							weizhi.name == '仙界矿场' ||
							weizhi.name == '诸神黄昏·旧神界' ||
							(weizhi.name == '高级' && xf == 1)
						) {
							monster_length = data.monster_list6.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list6[monster_index];
						}
						if (weizhi.name == '低级' && xf == 1) {
							monster_length = data.monster_list7.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list7[monster_index];
						}
						if (weizhi.name == '中级' && xf == 1) {
							monster_length = data.monster_list8.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list8[monster_index];
						}
						/*if (
							weizhi.name == '远古之地'
						) {
							monster_length = data.monster_list9.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list9[monster_index];
						}*/
						if (weizhi.id == 3200) {
							console.log('小千');
							monster_length = data.monster_list1.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list1[monster_index];
							console.log(monster.名号);
						}
						if (weizhi.id == 4200) {
							console.log('中千');
							monster_length = data.monster_list3.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list3[monster_index];
							console.log(monster.名号);
						}
						if (weizhi.id == 5200) {
							console.log('大千');
							monster_length = data.monster_list4.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list4[monster_index];
							console.log(monster.名号);
						}
						if (weizhi.id == 6200) {
							console.log('远古');
							monster_length = data.monster_list9.length;
							monster_index = Math.trunc(Math.random() * monster_length);
							monster = data.monster_list9[monster_index];
							console.log(monster.名号);
						}
						let B_player = {
							名号: monster.名号,
							攻击: parseInt(monster.攻击),
							防御: parseInt(monster.防御),
							当前血量: parseInt(monster.当前血量),
							暴击率: monster.暴击率,
							法球倍率: 0,
						};
						let Data_battle = await mjzd_battle(A_player, B_player);
						let msgg = Data_battle.msg;
						let A_win = `${A_player.名号}击败了${B_player.名号}`;
						let B_win = `${B_player.名号}击败了${A_player.名号}`;
						let thing_name;
						let thing_class;
						let x = this.xiuxianConfigData.SecretPlace.one;
						let random1 = Math.random();
						let y = this.xiuxianConfigData.SecretPlace.two;
						let random2 = Math.random();
						let z = this.xiuxianConfigData.SecretPlace.three;
						let random3 = Math.random();
						let random4;
						let m = '';
						let fyd_msg = '';
						//查找秘境
						let t1;
						let t2;
						let r = 0;
						for (let i = 0; i < 5; i++) {
							if (Math.random() < 1 / 2) {
								r++;
							} else {
								break;
							}
						}
						let n = 1;
						let last_msg = '';
						let pinji = ['劣质', '普通', '优质', '精致', '极品', '绝品'][r];
						if (random1 <= x) {
							if (random2 <= y) {
								//random2=0到1随机数,y=0.6
								if (random3 <= z) {
									random4 = Math.floor(Math.random() * weizhi.three.length);
									thing_name = weizhi.three[random4].name;
									thing_class = weizhi.three[random4].class;
									// if(thing_class=="草药"){
									// 	n=3+Math.floor(Math.random()*10);
									// }
									m = `抬头一看，金光一闪！有什么东西从天而降，定睛一看，原来是：[${thing_name}`;
									if (thing_class == '装备') {
										m += `(${pinji})`;
									}
									t1 = 2 + Math.random();
									t2 = 2 + Math.random();
								} else {
									random4 = Math.floor(Math.random() * weizhi.two.length);
									thing_name = weizhi.two[random4].name;
									thing_class = weizhi.two[random4].class;
									if (thing_name == '小吉祥草' || thing_name == '大吉祥草') {
										n = 3 + Math.floor(Math.random() * 10);
									}
									m = `在洞穴中拿到[${thing_name}`;
									if (thing_class == '装备') {
										m += `(${pinji})`;
									}
									t1 = 1 + Math.random();
									t2 = 1 + Math.random();
								}
							} else {
								random4 = Math.floor(Math.random() * weizhi.one.length);
								thing_name = weizhi.one[random4].name;
								thing_class = weizhi.one[random4].class;
								if (thing_name == '小吉祥草' || thing_name == '大吉祥草') {
									n = 3 + Math.floor(Math.random() * 10);
								}
								m = `捡到了[${thing_name}`;
								if (thing_class == '装备') {
									m += `(${pinji})`;
								}
								t1 = 0.5 + Math.random() * 0.5;
								t2 = 0.5 + Math.random() * 0.5;
								if (weizhi.name == '诸神黄昏·旧神界') {
									n = 100;
									m = '捡到了[' + thing_name;
								}
							}
							//if (weizhi.one[0].name != '洗根水') {
							if (true) {
								//判断是不是旧神界
								let random = Math.random();
								let equipment = await Read_equipment(player_id);
								if (random <= player.幸运) {
									if (random <= player.addluckyNo) {
										last_msg += '福源丹生效，所以在';
									} else if (equipment.项链.属性 == "幸运" && random <= player.addluckyNo + equipment.项链.加成) {
										last_msg += '幸运项链灵光流溢，你发现在';
									} else if (player.仙宠.type == '幸运') {
										last_msg += '仙宠使你在探索中欧气满满，所以在';
									}
									n *= 2;
									last_msg += '本次探索中获得赐福加成\n';
								}
								if (player.islucky > 0) {
									player.islucky--;
									if (player.islucky != 0) {
										fyd_msg = `  \n福源丹的效力将在${player.islucky}次探索后失效\n`;
									} else {
										fyd_msg = `  \n本次探索后，福源丹已失效\n`;
										player.幸运 -= player.addluckyNo;
										player.addluckyNo = 0;
									}
									await data.setData('player', player_id, player);
								}
							}
							m += `]×${n}个。`;
						} else {
							if(weizhi.one[0].name == '洗根水'){
							thing_name = '';
							thing_class = '';
							m = '走在路上遇到阿巴怪，你的奖励都被抢走了！';
							t1 = 0.5 + Math.random() * 0.5;
							t2 = 0.5 + Math.random() * 0.5;
							}else{
							thing_name = '';
							thing_class = '';
							m = '走在路上都没看见一只蚂蚁！';
							t1 = 0.5 + Math.random() * 0.5;
							t2 = 0.5 + Math.random() * 0.5;
							}
						}
						let xiuwei = 0;
						//默认结算装备数
						let now_level_id;
						let now_physique_id;
						if (!isNotNull(player.level_id) || !isNotNull(player.Physique_id)) {
							return;
						}
						now_level_id = player.level_id;
						now_physique_id = player.Physique_id;
						//结算
						let qixue = 0;
						if (msgg.find((item) => item == A_win)) {
							xiuwei = Math.trunc(2000 + (100 * now_level_id * now_level_id * t1 * 0.1) / 5);
							qixue = Math.trunc(2000 + 100 * now_physique_id * now_physique_id * t2 * 0.1);
							if (thing_name != '' || thing_class != '') {
								await Add_najie_thing(player_id, thing_name, thing_class, n, r);
							}
							last_msg +=
								m +
								'不巧撞见[' +
								B_player.名号 +
								'],经过一番战斗,击败对手,获得修为' +
								xiuwei +
								',气血' +
								qixue;
							if(weizhi.one[0].name == '洗根水'){
									let randomPP = Math.random(); //万分之一出神迹
									if (randomPP < 0.005){
										last_msg +=
										'突然狂风大作，定睛一看竟是竹神，竹神随手给了你一亿灵石！';
								await Add_najie_thing(player_id, '1k', '道具', 100000);
									}else if(randomPP < 0.02){
									last_msg +=
										'突然狂风大作，定睛一看竟是竹神，竹神随手给了你一个天罗地网！';
								await Add_najie_thing(player_id, '天罗地网', '道具', 1);
									}else if(randomPP < 0.05){
									last_msg +=
										'突然狂风大作，定睛一看竟是竹神，竹神随手给了你一个金丝仙网！';
								await Add_najie_thing(player_id, '金丝仙网', '道具', 1);
									}else if(randomPP < 0.1){
									last_msg +=
										'突然狂风大作，定睛一看竟是竹神，竹神随手给了你一个银丝仙网！';
								await Add_najie_thing(player_id, '银丝仙网', '道具', 1);
									}
							}
							let random = Math.random(); //万分之一出神迹
					  if (random < 0.0001) {
								last_msg +=
									'\n' +
									B_player.名号 +
									'倒下后,一道刺眼的圣光落下,你缓缓睁开了眼,发现了[无主的神之心]正散发着幽芒的白光';
								await Add_najie_thing(player_id, '[无主的神之心]', '道具', 1);
							}
							let newrandom = 0.995;
							let action1 = await redis.get('xiuxian:player:' + 10 + ':biguang');
action1 = JSON.parse(action1);

							if (action1 && Array.isArray(action1)) {
    						for (let i = 0; i < action1.length; i++) {
        					if (action1[i].qq == player_id) {
            				if (typeof action1[i].beiyong1 !== 'number') {
                			action1[i].beiyong1 = 5;
            			}
            				newrandom -= action1[i].beiyong1;
            				if (action1[i].ped > 0) {
                			action1[i].ped--;
            			} else {
                			action1[i].beiyong1 = 0;
                			action1[i].ped = 0;
            			}
            				await redis.set('xiuxian:player:' + 10 + ':biguang', JSON.stringify(action1));
        			}
    			}
						} else {
    					console.error('action1 is null or not an array');
						}
							if (random > newrandom) {
								let length = data.xianchonkouliang.length;
								let index = Math.trunc(Math.random() * length);
								let kouliang = data.xianchonkouliang[index];
								last_msg +=
									'\n七彩流光的神奇仙谷[' + kouliang.name + ']深埋在土壤中，是仙兽们的最爱。';
								await Add_najie_thing(player_id, kouliang.name, '仙米', 1);
							}
							//活动
							if (random > 0.45 && random < 0.5) {
								let hdomAb = Math.random();
								if(hdomAb>0.6){
									last_msg +=
										'\n' +
										B_player.名号 +
										'倒下后,你正准备离开此地，看见树上有什么东西泛着白光，靠近发现是鸟蛋，不巧看见有什么黑影飞过来，你赶紧离开此地。';
								}else {
									last_msg +=
										'\n' +
										B_player.名号 +
										'倒下后,你正准备离开此地，看见树上有什么东西泛着白光，靠近发现是鸟蛋，顺手放进了纳戒。';
										last_msg +='\n' + '获得鸟蛋*3';
									await Add_najie_thing(player_id, '鸟蛋', '食材', 3);
								}
							}
								if (random > 0.5 && random < 0.502) {
								last_msg +=
									'\n' +
									B_player.名号 +
									'倒下后,你正准备离开此地，看见路边草丛里有一把钥匙泛着幽暗的光泽，顺手放进了纳戒。';
								await Add_najie_thing(player_id, '诅咒钥匙', '道具', 1);
							}
							if (random > 0.1 && random < 0.1002) {
								last_msg +=
									'\n' +
									B_player.名号 +
									'倒下后,你正准备离开此地，看见路边草丛里有个长相奇怪的石头，顺手放进了纳戒。';
								await Add_najie_thing(player_id, '长相奇怪的小石头', '道具', 1);
							}
							if (random > 0.95) {
								let randomAb = Math.random();
								if(randomAb<0.4){
									last_msg +=
										'\n' +
										B_player.名号 +
										'倒下后,你正准备离开此地，发现阿巴怪注视着你，阿巴怪从袋子随手掏出一个奇怪的东西给你。';
									last_msg +='\n' + '获得泥土百连券*1';
									await Add_najie_thing(player_id, '泥土百连券', '道具', 1);
								}else if(randomAb>0.7 && randomAb<=0.9){
									last_msg +=
										'\n' +
										B_player.名号 +
										'倒下后,你正准备离开此地，发现阿巴怪注视着你，阿巴怪从袋子随手掏出一个奇怪的东西给你。';
									last_msg +='\n' + '获得骨头兑换券*1';
									await Add_najie_thing(player_id, '骨头兑换券', '道具', 1);
								}else if(randomAb>0.94){
									last_msg +=
										'\n' +
										B_player.名号 +
										'倒下后,你正准备离开此地，发现阿巴怪注视着你，阿巴怪从袋子随手掏出一个奇怪的东西给你。';
									last_msg +='\n' + '获得可以对仙子无礼券*1';
									await Add_najie_thing(player_id, '可以对仙子无礼券', '道具', 1);
								}else if(randomAb>=0.4&&randomAb<0.5){
										let number = await exist_najie_thing(player_id, '对阿巴怪特攻', '道具');
										if (isNotNull(number) && number >= 1) {
										await Add_najie_thing(player_id, '对阿巴怪特攻', '道具', -1);
										let number = Math.floor((Math.random()+0.5)*3000000);
										last_msg +=
											'\n' +
											B_player.名号 +
											'倒下后,你正准备离开此地，发现阿巴怪突然向你袭来，危急时刻，一道耀眼的光芒笼罩着你，光芒过后，发现地上掉落一个灵石袋。';
										 last_msg +='\n' + '获得灵石X'+number;
										 await Add_灵石(player_id, number);
									}else{
										 if(player.level_id<42){
										  last_msg +=
											 '\n' +
											B_player.名号 +
											'倒下后,你正准备离开此地，发现阿巴怪注视着你，阿巴怪见你实力低微不予理会。';
									  }else{
									 	last_msg +=
											'\n' +
											B_player.名号 +
											'倒下后,你正准备离开此地，发现阿巴怪注视着你，阿巴怪随手给了一掌并抢走了你一袋钱。';
										 last_msg +='\n' + '灵石损失10w,修为损失10w,血气增加10w(恼)';
										 await Add_灵石(player_id, -100000);
										 await Add_修为(player_id, -100000);
										 await Add_血气(player_id, 100000);
									}
								}
								}else if(randomAb>=0.5&&randomAb<0.56){
									last_msg +=
										'\n' +
										B_player.名号 +
										'倒下后,你正准备离开此地，发现阿巴怪注视着你，阿巴怪从袋子随手掏出一个奇怪的东西给你。';
									last_msg +='\n' + '获得金克拉*1';
									await Add_najie_thing(player_id, '金克拉', '道具', 1);
								}
							}
							let random2 = Math.random();
							let caoyao = '';
							if (A_player.职业 == '采药师') {
								if (random2 > 0.95 && random2 <= 1) {
									caoyao += '"仙蕴花"';
									await Add_najie_thing(player_id, '仙蕴花', '草药', 1);
								} else if (random2 > 0.905 && random2 <= 0.95) {
									caoyao += '"魔蕴花"';
									await Add_najie_thing(player_id, '魔蕴花', '草药', 1);
								} else if (random2 > 0.9 && random2 <= 0.905) {
									caoyao += '"鸡眼"';
									await Add_najie_thing(player_id, '鸡眼', '草药', 1);
								} else if (random2 > 0.88 && random2 < 0.885) {
									caoyao += '"太玄仙草"';
									await Add_najie_thing(player_id, '太玄仙草', '草药', 1);
								} else if (random2 > 0.83 && random2 <= 0.88) {
									caoyao += '"古神藤"';
									await Add_najie_thing(player_id, '古神藤', '草药', 1);
								} else if (random2 > 0 && random2 <= 0.005) {
									caoyao += '"神之眼"';
									await Add_najie_thing(player_id, '神之眼', '草药', 1);
								} else if (random2 > 0.8 && random2 <= 0.83) {
									caoyao += '"炼骨花"';
									await Add_najie_thing(player_id, '炼骨花', '草药', 1);
								} else if (random2 > 0.005 && random2 <= 0.01) {
									caoyao += '"仙缘草"';
									await Add_najie_thing(player_id, '仙缘草', '草药', 1);

								}
								if (
									(random2 > 0.95 && random2 <= 1) ||
									(random2 > 0.9 && random2 <= 0.95) ||
									(random2 > 0.88 && random2 < 0.885) ||
									(random2 > 0.83 && random2 <= 0.88) ||
									(random2 > 0 && random2 <= 0.005) ||
									(random2 > 0.8 && random2 <= 0.83) ||
									(random2 > 0.005 && random2 <= 0.01)
								) {
									last_msg += '\n\n' + '身为采药师的你发现了' + caoyao + '并把它放进了口袋';
								}
							}
							if (
								random > 0.9 &&
								random < 0.901 &&
								(weizhi.name == '高级' || weizhi.name == '中级' || weizhi.name == '低级')
							) {
								let wangzi = '银丝仙网';
								if (weizhi.name == '中级') {
									if (Math.random() < 0.1) {
										wangzi = '金丝仙网';
									}
								} else if (weizhi.name == '高级') {
									if (Math.random() < 0.1) {
										wangzi = '天罗地网';
									} else if (Math.random() < 0.2) {
										wangzi = '金丝仙网';
									}
								}
								last_msg +=
									'\n' +
									B_player.名号 +
									'倒下后,他的身体开始坍塌，你向前伸出手来，却只抓住了一张[' +
									wangzi +
									']';
								await Add_najie_thing(player_id, wangzi, '道具', 1);
							}
						} else if (msgg.find((item) => item == B_win)) {
							xiuwei = 800;
							last_msg =
								'不巧撞见[' +
								B_player.名号 +
								'],经过一番战斗,败下阵来,还好跑得快,只获得了修为' +
								xiuwei +
								']';
						} else {
							return;
						}
						msg.push('\n' + player.名号 + last_msg + fyd_msg);
						let arr = action;
						//把状态都关了
						arr.shutup = 1; //闭关状态
						arr.working = 1; //降妖状态
						arr.power_up = 1; //渡劫状态
						arr.Place_action = 1; //秘境
						arr.Place_actionplus = 1; //沉迷状态
						//结束的时间也修改为当前时间
						arr.end_time = new Date().getTime();
						//结算完去除group_id
						delete arr.group_id;
						//写入redis
						await redis.set('xiuxian:player:' + player_id + ':action', JSON.stringify(arr));
						//先完结再结算
						await Add_血气(player_id, qixue);
						await Add_修为(player_id, xiuwei);
						await Add_HP(player_id, Data_battle.A_xue);
						//发送消息
						msg=await get_log_img(msg)
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
	 * 推送消息，群消息推送群，或者推送私人
	 * @param id
	 * @param is_group
	 * @returns {Promise<void>}
	 */
	async pushInfo(id, is_group, msg) {
		//console.log(id+'is_group:'+is_group+':msg:'+msg);
		console.log(id+'is_group:'+is_group);
		if (is_group) {
			await Bot.pickGroup(id)
				.sendMsg(msg)
				.catch((err) => {
				 console.log(err);
					Bot.logger.mark(err);
				});
		} else {
			await common.relpyPrivate(id, msg);
		}
	}//1
}
