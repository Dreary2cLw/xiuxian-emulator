import plugin from '../../../../lib/plugins/plugin.js';
import config from '../../model/Config.js';
import data from '../../model/XiuxianData.js';
import {
	player_efficiency,
	shijianc,
	timestampToTime,
} from '../Xiuxian/xiuxian.js';

//要DIY的话，确保这两个数组长度相等
const 宗门人数上限 = [6, 9, 12, 15, 18, 21, 24, 27, 30];
const 副宗主人数上限 = [1, 1, 1, 1, 2, 2, 3, 3, 4];
const 长老人数上限 = [1, 2, 3, 4, 5, 7, 8, 9, 10];
const 内门弟子上限 = [2, 3, 4, 5, 6, 8, 10, 12, 15];
const 宗门灵石池上限 = [
	4000000, 8000000, 12000000, 16000000, 20000000, 24000000, 28000000, 32000000,
	36000000,
];

/**
 * 宗门
 */

export class AssociationAdmin extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'AssociationAdmin',
			/** 功能描述 */
			dsc: '宗门模块',
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 600,
			rule: [
				{
					reg: '^#开宗立派$',
					fnc: 'Create_association',
				},
				{
					reg: '^#(升级宗门|宗门升级)$',
					fnc: 'lvup_association',
				},
				{
					reg: '^任命.*',
					fnc: 'Set_appointment',
				},
				{
					reg: '^#(宗门维护|维护宗门)$',
					fnc: 'Maintenance',
				},
				{
					reg: '^#查看护宗大阵$',
					fnc: 'huz',
				},
				{
					reg: '^#维护护宗大阵[1-9]d*',
					fnc: 'weihu',
				},
				{
					reg: '^#设置门槛.*$',
					fnc: 'jiaru',
				},
				{
					reg: '^#逐出师门.*$',
					fnc: 'Deleteuser',
				},
				{
					reg: '^#逐出[1-9]d*',
					fnc: 'Deleteusermax',
				},
				{
					reg: '^#内门弟子列表',
					fnc: 'neimenList',
				}
			],
		});
		this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
	}

	//判断是否满足创建宗门条件
	async Create_association(e) {
		let usr_qq = e.user_id;
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let player = data.getData('player', usr_qq);

		let now_level_id;
		if (!isNotNull(player.level_id)) {
			this.reply('请先#一键同步');
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;

		if (now_level_id < 22) {
			e.reply('修为达到化神再来吧');
			return;
		}

		if (now_level_id >= 42 && now_level_id < 45) {
			e.reply('你的仙宗成立了！');
			await sleep(3000);
			e.reply(
				'你未通过仙界宗门管理委员会的宗主测试！\n' +
					'仙界宗门管理委员会将你的宗门强制注销了！\n' +
					'请修炼到玄仙再来注册！'
			);
			return;
		}

		if (isNotNull(player.宗门)) {
			e.reply('已经有宗门了');
			return;
		}
		if (player.灵石 < 10000) {
			e.reply('开宗立派是需要本钱的,攒到一万灵石再来吧');
			return;
		}

		/** 设置上下文 */
		this.setContext('Get_association_name');
		/** 回复 */
		await e.reply(
			'请发送宗门的名字,一旦设立,无法再改,请慎重取名,(宗门名字最多6个中文字符)',
			false,
			{ at: true }
		);

		return;
	}

	/** 获取宗门名称 */
	async Get_association_name(e) {
		let usr_qq = e.user_id;
		/** 内容 */
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let new_msg = this.e.message;
		if (new_msg[0].type != 'text') {
			this.setContext('Get_association_name');
			await this.reply('请发送文本,请重新输入:');
			return;
		}
		let association_name = new_msg[0].text;
		if (association_name.length > 6) {
			this.setContext('Get_association_name');
			await this.reply('宗门名字最多只能设置6个字符,请重新输入:');
			return;
		}
		let reg = /[^\u4e00-\u9fa5]/g; //汉字检验正则
		let res = reg.test(association_name);
		//res为true表示存在汉字以外的字符
		if (res) {
			this.setContext('Get_association_name');
			await this.reply('宗门名字只能使用中文,请重新输入:');
			return;
		}
		let ifexistass = data.existData('association', association_name);
		if (ifexistass) {
			this.setContext('Get_association_name');
			await this.reply('该宗门已经存在,请重新输入:');
			return;
		}

		//await this.reply('功能还在开发中,敬请期待');
		let now = new Date();
		let nowTime = now.getTime(); //获取当前时间戳
		let date = timestampToTime(nowTime);
		let player = data.getData('player', usr_qq);
		player.宗门 = {
			宗门名称: association_name,
			职位: '宗主',
			time: [date, nowTime],
		};
		await data.setData('player', usr_qq, player);
		await new_Association(association_name, usr_qq, e);
		await setFileValue(usr_qq, -10000, '灵石');
		await this.reply('宗门创建成功');
		/** 结束上下文 */
		this.finish('Get_association_name');
		//return association_name;
	}

	//护宗大阵
	async huz(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = data.getData('player', usr_qq);
		if (!isNotNull(player.宗门)) {
			e.reply('你尚未加入宗门');
			return;
		}
		let ass = data.getAssociation(player.宗门.宗门名称);
		e.reply(`护宗大阵血量:${ass.大阵血量}`);
		return;
	}

	async weihu(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = data.getData('player', usr_qq);
		if (
			player.宗门.职位 == '宗主' ||
			player.宗门.职位 == '副宗主' ||
			player.宗门.职位 == '长老'
		) {
		} else {
			e.reply('只有宗主、副宗主或长老可以操作');
			return;
		}

		if (!isNotNull(player.宗门)) {
			e.reply('你尚未加入宗门');
			return;
		}
		//获取灵石数量
		let reg = new RegExp(/#维护护宗大阵/);
		let lingshi = e.msg.replace(reg, '');
		lingshi = lingshi.trim(); //去掉空格
		//校验输入灵石数
		if (parseInt(lingshi) == parseInt(lingshi) && parseInt(lingshi) > 0) {
			lingshi = parseInt(lingshi);
		} else {
			e.reply('请输入正确灵石数');
			return;
		}
		let ass = data.getAssociation(player.宗门.宗门名称);
		if (ass.灵石池 < lingshi) {
			e.reply(`宗门灵石池只有${ass.灵石池}灵石,数量不足`);
			return;
		}
		let xian = 5;
		if (ass.power == 1) {
			xian = 2;
		}
		ass.大阵血量 += lingshi * xian;
		ass.灵石池 -= lingshi;
		await data.setAssociation(ass.宗门名称, ass);
		e.reply(
			`维护成功,宗门还有${ass.灵石池}灵石,护宗大阵增加了${lingshi * xian}血量`
		);
	}

	//升级宗门
	async lvup_association(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = data.getData('player', usr_qq);
		if (!isNotNull(player.宗门)) {
			e.reply('你尚未加入宗门');
			return;
		}
		if (player.宗门.职位 != '宗主' && player.宗门.职位 != '副宗主') {
			e.reply('只有宗主、副宗主可以操作');
			return;
		}
		let ass = data.getAssociation(player.宗门.宗门名称);
		if (ass.宗门等级 == 宗门人数上限.length) {
			e.reply('已经是最高等级宗门');
			return;
		}
		let xian = 1;
		if (ass.power == 1) {
			xian = 2;
		}
		if (ass.灵石池 < ass.宗门等级 * 2000000 * xian) {
			e.reply(
				`本宗门目前灵石池中仅有${ass.灵石池}灵石,当前宗门升级需要${
					ass.宗门等级 * 2000000 * xian
				}灵石,数量不足`
			);
			return;
		}

		ass.灵石池 -= ass.宗门等级 * 2000000 * xian;
		ass.宗门等级 += 1;
		// if (ass.宗门等级 == 8) {
		//     let i = '';
		//     let homestudy = '';
		//     i = Math.floor(
		//         data.homegongfa_list.filter(item => item.type == '传承').length *
		//         Math.random()
		//     );
		//     homestudy = data.homegongfa_list.filter(item => item.type == '传承')[i];
		//     ass.传承功法 = homestudy;
		//     e.reply('宗门获得传承神石,石上刻写了 <' + ass.传承功法.name + '>的口诀要领');
		// }
		await data.setData('player', usr_qq, player);
		await data.setAssociation(ass.宗门名称, ass);
		await player_efficiency(usr_qq);
		e.reply(
			'宗门升级成功' +
				`当前宗门等级为${ass.宗门等级},宗门人数上限提高到:${
					宗门人数上限[ass.宗门等级 - 1]
				}`
		);
		return;
	}

	//任命职位
	async Set_appointment(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let isat = e.message.some((item) => item.type === 'at');
		if (!isat) {
			return;
		} //没有at信息直接返回,不执行
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = await data.getData('player', usr_qq);
		if (!isNotNull(player.宗门)) {
			e.reply('你尚未加入宗门');
			return;
		}
		if (player.宗门.职位 != '宗主' && player.宗门.职位 != '副宗主') {
			e.reply('只有宗主、副宗主可以操作');
			return;
		}

		let atItem = e.message.filter((item) => item.type === 'at'); //获取at信息
		let member_qq = atItem[0].qq;
		if (usr_qq == member_qq) {
			e.reply('???');
			return;
		} //at宗主自己,这不扯犊子呢

		let ass = await data.getAssociation(player.宗门.宗门名称);
		let isinass = ass.所有成员.some((item) => item == member_qq); //这个命名可太糟糕了
		if (!isinass) {
			e.reply('只能设置宗门内弟子的职位');
			return;
		}
		let member = data.getData('player', member_qq); //获取这个B的存档
		let now_apmt = member.宗门.职位; //这个B现在的职位
		if (player.宗门.职位 == '副宗主' && now_apmt == '宗主') {
			e.reply('你想造反吗！？');
			return;
		}
		if (
			player.宗门.职位 == '副宗主' &&
			(now_apmt == '副宗主' || now_apmt == '长老')
		) {
			e.reply(`宗门${now_apmt}任免请上报宗主！`);
			return;
		}
		let full_apmt = ass.所有成员.length;
		//检索输入的第一个职位
		let reg = new RegExp(/副宗主|长老|外门弟子|内门弟子/);
		let appointment = reg.exec(e.msg); //获取输入的职位
		if (appointment == now_apmt) {
			e.reply(`此人已经是本宗门的${appointment}`);
			return;
		}
		if (appointment == '长老') {
			full_apmt = 长老人数上限[ass.宗门等级 - 1];
		}
		if (appointment == '副宗主') {
			full_apmt = 副宗主人数上限[ass.宗门等级 - 1];
		} else if (appointment == '内门弟子') {
			full_apmt = 内门弟子上限[ass.宗门等级 - 1];
		}
		if (ass[appointment].length >= full_apmt) {
			e.reply(`本宗门的${appointment}人数已经达到上限`);
			return;
		}
		member.宗门.职位 = appointment; //成员存档里改职位
		ass[now_apmt] = ass[now_apmt].filter((item) => item != member_qq); //原来的职位表删掉这个B
		ass[appointment].push(member_qq); //新的职位表加入这个B
		await data.setData('player', member_qq, member); //记录到存档
		await data.setAssociation(ass.宗门名称, ass); //记录到宗门
		e.reply([
			segment.at(member_qq),
			`${ass.宗门名称} ${player.宗门.职位} 已经成功将${member.名号}任命为${appointment}!`,
		]);
		return;
	}

	//宗门维护
	async Maintenance(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = await data.getData('player', usr_qq);
		if (!isNotNull(player.宗门)) {
			return;
		}
		if (player.宗门.职位 != '宗主' && player.宗门.职位 != '副宗主') {
			e.reply('只有宗主、副宗主可以操作');
			return;
		}
		let ass = await data.getAssociation(player.宗门.宗门名称);
		let now = new Date();
		let nowTime = now.getTime(); //获取当前日期的时间戳
		let time = this.xiuxianConfigData.CD.association;
		let nextmt_time = await shijianc(ass.维护时间 + 60000 * time); //获得下次宗门维护日期,7天后
		if (ass.维护时间 > nowTime - 1000 * 60 * 60 * 24 * 7) {
			e.reply(
				`当前无需维护,下次维护时间:${nextmt_time.Y}年${nextmt_time.M}月${nextmt_time.D}日${nextmt_time.h}时${nextmt_time.m}分${nextmt_time.s}秒`
			);
			return;
		}
		if (ass.灵石池 < ass.宗门等级 * 50000) {
			e.reply(`目前宗门维护需要${ass.宗门等级 * 50000}灵石,本宗门灵石池储量不足`);
			return;
		}
		ass.灵石池 -= ass.宗门等级 * 50000;
		ass.维护时间 = nowTime;
		await data.setAssociation(ass.宗门名称, ass); //记录到宗门
		nextmt_time = await shijianc(ass.维护时间 + 60000 * time);
		e.reply(
			`宗门维护成功,下次维护时间:${nextmt_time.Y}年${nextmt_time.M}月${nextmt_time.D}日${nextmt_time.h}时${nextmt_time.m}分${nextmt_time.s}秒`
		);
		return;
	}

	//设置最低加入境界
	async jiaru(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let player = await data.getData('player', usr_qq);
		if (!isNotNull(player.宗门)) {
			return;
		}
		if (
			player.宗门.职位 == '宗主' ||
			player.宗门.职位 == '副宗主' ||
			player.宗门.职位 == '长老'
		) {
		} else {
			e.reply('只有宗主、副宗主或长老可以操作');
			return;
		}
		let jiar = e.msg.replace('#设置门槛', '');
		jiar = jiar.trim();
		if (!data.Level_list.some((item) => item.level == jiar)) {
			return;
		}
		let jr_level_id = data.Level_list.find((item) => item.level == jiar).level_id;
		let ass = data.getAssociation(player.宗门.宗门名称);
		if (ass.power == 0 && jr_level_id > 41) {
			jr_level_id = 41;
			e.reply('不知哪位大能立下誓言：凡界无仙！');
		}
		if (ass.power == 1 && jr_level_id < 42) {
			jr_level_id = 42;
			e.reply('仅仙人可加入仙宗');
		}
		ass.最低加入境界 = jr_level_id;
		e.reply('已成功设置宗门门槛，当前门槛:' + jiar);
		await data.setAssociation(ass.宗门名称, ass);

		return;
	}
async neimenList(e){
	if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = await data.getData('player', usr_qq);
		if (!isNotNull(player.宗门)) {
			return;
		}
		let ass = data.getAssociation(player.宗门.宗门名称);
		if(ass == null){
		e.reply('宗门不存在');
		return;
		}
		let neimenList = ass.内门弟子;
		let msg = '内门弟子：\n';
	 	e.reply(msg+neimenList);
		return;
}
	async Deleteusermax(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = await data.getData('player', usr_qq);
		if (!isNotNull(player.宗门)) {
			return;
		}

		let menpai = e.msg.replace('#', '');

		menpai = menpai.replace('逐出', '');

		let member_qq = menpai;

		if (usr_qq == member_qq) {
			e.reply('???');
			return;
		}

		let ifexistplayB = data.existData('player', member_qq);
		if (!ifexistplayB) {
			e.reply('此人未踏入仙途！');
			return;
		}
		let playerB = await data.getData('player', member_qq);
		if (!isNotNull(playerB.宗门)) {
			e.reply('对方尚未加入宗门');
			return;
		}
		let ass = data.getAssociation(player.宗门.宗门名称);
		let bss = data.getAssociation(playerB.宗门.宗门名称);
		if (ass.宗门名称 != bss.宗门名称) {
			return;
		}
		let now = new Date();
		let nowTime = now.getTime(); //获取当前时间戳
		let addTime;
		let time = this.xiuxianConfigData.CD.joinassociation; //分钟
		if (typeof playerB.宗门.time == 'undefined') {
			addTime = playerB.宗门.加入时间[1] + 60000 * time;
		} else {
			//新版本的数据变成了time
			addTime = playerB.宗门.time[1] + 60000 * time;
		}
		if (addTime > nowTime) {
			e.reply('对面加入宗门不满' + `${time}分钟,无法踢出`);
			return;
		}
		if (player.宗门.职位 == '宗主') {
			if (usr_qq == member_qq) {
				e.reply('？？？'); //踢自己？
				return;
			}
			bss[playerB.宗门.职位] = bss[playerB.宗门.职位].filter(
				(item) => item != member_qq
			);
			bss['所有成员'] = bss['所有成员'].filter((item) => item != member_qq);
			await data.setAssociation(bss.宗门名称, bss);
			await delete playerB.宗门;
			await data.setData('player', member_qq, playerB);
			await player_efficiency(member_qq);
			e.reply('已踢出！');
			return;
		}
		if (player.宗门.职位 == '副宗主') {
			if (playerB.宗门.职位 == '宗主') {
				e.reply('你没权限');
				return;
			}
			if (playerB.宗门.职位 == '长老' || playerB.宗门.职位 == '副宗主') {
				e.reply(`宗门${playerB.宗门.职位}任免请上报宗主！`);
				return;
			}
			bss[playerB.宗门.职位] = bss[playerB.宗门.职位].filter(
				(item) => item != member_qq
			);
			bss['所有成员'] = bss['所有成员'].filter((item) => item != member_qq);
			await data.setAssociation(bss.宗门名称, bss);
			await delete playerB.宗门;
			await data.setData('player', member_qq, playerB);
			await player_efficiency(member_qq);
			e.reply('已踢出！');
			return;
		}
		if (player.宗门.职位 == '长老') {
			if (playerB.宗门.职位 == '宗主' || playerB.宗门.职位 == '副宗主') {
				e.reply('造反啦？');
				return;
			}
			if (playerB.宗门.职位 == '长老') {
				e.reply(`宗门${playerB.宗门.职位}任免请上报宗主！`);
				return;
			}
			bss[playerB.宗门.职位] = bss[playerB.宗门.职位].filter(
				(item) => item != member_qq
			);
			bss['所有成员'] = bss['所有成员'].filter((item) => item != member_qq);
			await data.setAssociation(bss.宗门名称, bss);
			await delete playerB.宗门;
			await data.setData('player', member_qq, playerB);
			await player_efficiency(member_qq);
			e.reply('已踢出！');
			return;
		}
		playerB.favorability = 0;
		await data.setData('player', member_qq, playerB);
	}

	async Deleteuser(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = await data.getData('player', usr_qq);
		if (!isNotNull(player.宗门)) {
			return;
		}
		let atItem = e.message.filter((item) => item.type === 'at'); //获取at信息
		if (!atItem) {
			return;
		} //没有at信息直接返回,不执行
		let member_qq = atItem[0].qq;
		if (usr_qq == member_qq) {
			e.reply('???');
			return;
		}

		let ifexistplayB = data.existData('player', member_qq);
		if (!ifexistplayB) {
			e.reply('此人未踏入仙途！');
			return;
		}
		let playerB = await data.getData('player', member_qq);
		if (!isNotNull(playerB.宗门)) {
			e.reply('对方尚未加入宗门');
			return;
		}
		let ass = data.getAssociation(player.宗门.宗门名称);
		let bss = data.getAssociation(playerB.宗门.宗门名称);
		if (ass.宗门名称 != bss.宗门名称) {
			return;
		}
		let now = new Date();
		let nowTime = now.getTime(); //获取当前时间戳
		let addTime;
		let time = this.xiuxianConfigData.CD.joinassociation; //分钟
		if (typeof playerB.宗门.time == 'undefined') {
			addTime = playerB.宗门.加入时间[1] + 60000 * time;
		} else {
			//新版本的数据变成了time
			addTime = playerB.宗门.time[1] + 60000 * time;
		}
		if (addTime > nowTime) {
			e.reply('对面加入宗门不满' + `${time}分钟,无法踢出`);
			return;
		}
		if (player.宗门.职位 == '宗主') {
			if (usr_qq == member_qq) {
				e.reply('？？？'); // 自己踢自己？？
				return;
			}
			bss[playerB.宗门.职位] = bss[playerB.宗门.职位].filter(
				(item) => item != member_qq
			);
			bss['所有成员'] = bss['所有成员'].filter((item) => item != member_qq);
			await data.setAssociation(bss.宗门名称, bss);
			await delete playerB.宗门;
			await data.setData('player', member_qq, playerB);
			await player_efficiency(member_qq);
			e.reply('已踢出！');
			return;
		}
		if (player.宗门.职位 == '副宗主') {
			if (playerB.宗门.职位 == '宗主') {
				e.reply('造反啦？');
				return;
			}
			if (playerB.宗门.职位 == '长老' || playerB.宗门.职位 == '副宗主') {
				e.reply(`宗门${playerB.宗门.职位}任免请上报宗主！`);
				return;
			}
			bss[playerB.宗门.职位] = bss[playerB.宗门.职位].filter(
				(item) => item != member_qq
			);
			bss['所有成员'] = bss['所有成员'].filter((item) => item != member_qq);
			await data.setAssociation(bss.宗门名称, bss);
			await delete playerB.宗门;
			await data.setData('player', member_qq, playerB);
			await player_efficiency(member_qq);
			e.reply('已踢出！');
			return;
		}
		if (player.宗门.职位 == '长老') {
			if (playerB.宗门.职位 == '宗主' || playerB.宗门.职位 == '副宗主') {
				e.reply('造反啦？');
				return;
			}
			if (playerB.宗门.职位 == '长老') {
				e.reply(`宗门${playerB.宗门.职位}任免请上报宗主！`);
				return;
			}
			bss[playerB.宗门.职位] = bss[playerB.宗门.职位].filter(
				(item) => item != member_qq
			);
			bss['所有成员'] = bss['所有成员'].filter((item) => item != member_qq);
			await data.setAssociation(bss.宗门名称, bss);
			await delete playerB.宗门;
			await data.setData('player', member_qq, playerB);
			await player_efficiency(member_qq);
			e.reply('已踢出！');
			return;
		}
		playerB.favorability = 0;
		await data.setData('player', member_qq, playerB);
	}
}

/**
 * 创立新的宗门
 * @param name 宗门名称
 * @param holder_qq 宗主qq号
 */
async function new_Association(name, holder_qq, e) {
	let usr_qq = e.user_id;
	let player = data.getData('player', usr_qq);
	let now_level_id = data.Level_list.find(
		(item) => item.level_id == player.level_id
	).level_id;
	let x;
	let xian;
	let dj;
	if (now_level_id > 41) {
		x = 1;
		xian = 10;
		dj = 42;
	} else {
		x = 0;
		xian = 1;
		dj = 1;
	}
	let now = new Date();
	let nowTime = now.getTime(); //获取当前时间戳
	let date = timestampToTime(nowTime);
	let Association = {
		宗门名称: name,
		宗门等级: 1,
		创立时间: [date, nowTime],
		灵石池: 0,
		宗门驻地: 0,
		宗门建设等级: 0,
		宗门神兽: 0,
		宗主: holder_qq,
		副宗主: [],
		长老: [],
		内门弟子: [],
		外门弟子: [],
		所有成员: [holder_qq],
		药园: {
			药园等级: 1,
			作物: [
				{
					name: '凝血草',
					start_time: nowTime,
					who_plant: holder_qq,
				},
			],
		},
		维护时间: nowTime,
		大阵血量: 114514 * xian,
		最低加入境界: dj,
		power: x,
	};
	data.setAssociation(name, Association);
	return;
}

/**
 * 增加player文件某属性的值（在原本的基础上增加）
 * @param user_qq
 * @param num 属性的value
 * @param type 修改的属性
 * @returns {Promise<void>}
 */
export async function setFileValue(user_qq, num, type) {
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

//sleep
async function sleep(time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
}

/**
 * 判断对象是否不为undefined且不为null
 * @param obj 对象
 * @returns obj==null/undefined,return false,other return true
 */
function isNotNull(obj) {
	if (obj == undefined || obj == null) return false;
	return true;
}
