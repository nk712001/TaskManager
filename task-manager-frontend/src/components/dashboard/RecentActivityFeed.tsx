import React from 'react';
import { List, Avatar } from 'antd';

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => (
  <List
    itemLayout="horizontal"
    dataSource={activities}
    renderItem={item => (
      <List.Item>
        <List.Item.Meta
          avatar={<Avatar>{item.user[0]}</Avatar>}
          title={<span>{item.user} <span style={{ color: '#888' }}>{item.action}</span> <b>{item.target}</b></span>}
          description={item.time}
        />
      </List.Item>
    )}
  />
);

export default RecentActivityFeed;
