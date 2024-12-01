import React from 'react';

interface DashboardFrameProps {
  width: string;
  height: string;
  src: string;
  title: string;
}

const DashboardFrame: React.FC<DashboardFrameProps> = ({ width, height, src, title }) => {
  return <iframe width={width} height={height} src={src} title={title} style={{ border: 'none' }}></iframe>;
};

const HomeDashboards = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
        <DashboardFrame
          width="700" 
          height="600" 
          src="https://us-east-1.quicksight.aws.amazon.com/sn/embed/share/accounts/588738578192/dashboards/537bf805-68c1-4757-8054-b7f1808c9010/sheets/537bf805-68c1-4757-8054-b7f1808c9010_b567f4f4-6b54-4ca8-a25c-2268db677fda/visuals/537bf805-68c1-4757-8054-b7f1808c9010_8a4fdc10-1b0b-4eed-a9fb-9152204d8d27?directory_alias=InsightAI-QuickSight"
          title="Dashboard 1"
        />
        <DashboardFrame
          width="850" 
          height="640" 
          src="https://us-east-1.quicksight.aws.amazon.com/sn/embed/share/accounts/588738578192/dashboards/537bf805-68c1-4757-8054-b7f1808c9010/sheets/537bf805-68c1-4757-8054-b7f1808c9010_1f4c24fb-b78a-4349-ab8a-2fc7f5b0a7c3/visuals/537bf805-68c1-4757-8054-b7f1808c9010_d4a22378-4616-434b-973e-754826048d07?directory_alias=InsightAI-QuickSight"
          title="Dashboard 2"
        />
      </div>
      <br />
      <DashboardFrame
        width="1350"
        height="800"
        src="https://us-east-1.quicksight.aws.amazon.com/sn/embed/share/accounts/588738578192/dashboards/537bf805-68c1-4757-8054-b7f1808c9010/sheets/537bf805-68c1-4757-8054-b7f1808c9010_b2829132-7944-40aa-b3b7-1eb1aaaf4ec7/visuals/537bf805-68c1-4757-8054-b7f1808c9010_d3ece080-55e7-4f6b-b517-5b78462378d0?directory_alias=InsightAI-QuickSight"
        title="Dashboard 3"
      />
      <br />
      <DashboardFrame 
      width="1350" 
      height="650" 
      src="https://us-east-1.quicksight.aws.amazon.com/sn/embed/share/accounts/588738578192/dashboards/537bf805-68c1-4757-8054-b7f1808c9010/sheets/537bf805-68c1-4757-8054-b7f1808c9010_ea7a3f7e-c80e-4f91-85d4-e2937ca153d0/visuals/537bf805-68c1-4757-8054-b7f1808c9010_9e480518-a723-41b4-9a59-39f7f6a7e250?directory_alias=InsightAI-QuickSight"
      title="Dashboard 4"
      />
      <br />
      <DashboardFrame
        width="1350" 
        height="550" 
        src="https://us-east-1.quicksight.aws.amazon.com/sn/embed/share/accounts/588738578192/dashboards/537bf805-68c1-4757-8054-b7f1808c9010/sheets/537bf805-68c1-4757-8054-b7f1808c9010_22d20161-dec3-4d00-b97a-1093f107459d/visuals/537bf805-68c1-4757-8054-b7f1808c9010_65712933-5586-498b-ba7f-2042cde40cb4?directory_alias=InsightAI-QuickSight"
        title="Dashboard 5"
      />
      <br />
      <DashboardFrame
        width="13500" 
        height="600" 
        src="https://us-east-1.quicksight.aws.amazon.com/sn/embed/share/accounts/588738578192/dashboards/537bf805-68c1-4757-8054-b7f1808c9010/sheets/537bf805-68c1-4757-8054-b7f1808c9010_c576575c-fe1b-46e8-8a01-dc1645ef69cb/visuals/537bf805-68c1-4757-8054-b7f1808c9010_7592a05f-cbf7-48cd-8299-636d4992f6b0?directory_alias=InsightAI-QuickSight"
        title="Dashboard 6"
      />
    </div>
  );
};

export default HomeDashboards;
